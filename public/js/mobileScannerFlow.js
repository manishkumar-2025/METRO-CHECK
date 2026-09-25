/* ==========================================================================
   METRO-CHECK - Mobile Scanner & Multi-Image Capture Engine (js/mobileScannerFlow.js)
   Department of Consumer Affairs (Legal Metrology Division)
   Technical Architecture:
     ZoomManager: init, setZoom, renderZoomButtons, showSliderTemporary, reset, setupGestures
     CameraManager: startCamera, stopCamera, switchCamera, toggleFlash, closeCamera
     Scanner: startScanning, stopScanning, handleScan, addImage
     Images: scannedImages[], lastSource, addImage, addMoreImage, removeImage, clearImages, prevImage, nextImage
     UI: showScannerOptions, showCamera, showUpload, showImagePreview, showResult
   ========================================================================== */

(function (window, document) {
  'use strict';

  // Audio synthesis for native camera shutter click feedback
  function playNativeShutterSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.065);
    } catch (e) {
      // Audio playback skipped safely
    }
  }

  // ─── 1. IMAGES STATE STORE ────────────────────────────────────────────────
  const Images = {
    scannedImages: [],
    activeIndex: 0,
    lastSource: 'camera', // 'camera' or 'upload'

    addImage(dataUrl) {
      if (!dataUrl) return;
      this.scannedImages.push(dataUrl);
      this.activeIndex = this.scannedImages.length - 1;
      UI.showImagePreview();
    },

    addMoreImage(preferredSource) {
      const source = preferredSource || 'camera';
      if (source === 'upload') {
        UI.showUpload();
      } else {
        UI.showCamera();
      }
    },

    removeImage(index) {
      if (index >= 0 && index < this.scannedImages.length) {
        this.scannedImages.splice(index, 1);
        if (this.activeIndex >= this.scannedImages.length) {
          this.activeIndex = Math.max(0, this.scannedImages.length - 1);
        }
      }
      if (this.scannedImages.length === 0) {
        CameraManager.stopCamera();
        UI.showScannerOptions();
      } else {
        UI.showImagePreview();
      }
    },

    removeActiveImage() {
      this.removeImage(this.activeIndex);
    },

    clearImages() {
      this.scannedImages = [];
      this.activeIndex = 0;
    },

    setActiveIndex(index) {
      if (index >= 0 && index < this.scannedImages.length) {
        this.activeIndex = index;
        UI.updatePreviewDisplay();
      }
    },

    prevImage() {
      if (this.scannedImages.length <= 1) return;
      this.activeIndex = (this.activeIndex - 1 + this.scannedImages.length) % this.scannedImages.length;
      UI.updatePreviewDisplay();
    },

    nextImage() {
      if (this.scannedImages.length <= 1) return;
      this.activeIndex = (this.activeIndex + 1) % this.scannedImages.length;
      UI.updatePreviewDisplay();
    }
  };

  // ─── 2. NATIVE-STYLE ZOOM MANAGER ─────────────────────────────────────────
  const ZoomManager = {
    currentZoom: 1.0,
    minZoom: 1.0,
    maxZoom: 3.0,
    step: 0.1,
    hasNativeZoom: false,
    zoomPresets: [1.0, 2.0, 3.0],
    isPinching: false,
    initialPinchDist: 0,
    initialPinchZoom: 1.0,
    sliderTimeout: null,
    badgeTimeout: null,
    listenersAttached: false,

    init(track) {
      this.currentZoom = 1.0;
      this.hasNativeZoom = false;

      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities();
        if (caps && caps.zoom) {
          this.hasNativeZoom = true;
          this.minZoom = typeof caps.zoom.min === 'number' ? Math.max(0.5, caps.zoom.min) : 1.0;
          this.maxZoom = typeof caps.zoom.max === 'number' ? Math.min(10.0, caps.zoom.max) : 3.0;
          this.step = typeof caps.zoom.step === 'number' ? caps.zoom.step : 0.1;
        }
      }

      if (!this.hasNativeZoom) {
        // High-fidelity fallback zoom for mobile browsers without native zoom exposure
        this.minZoom = 1.0;
        this.maxZoom = 4.0;
        this.step = 0.1;
      }

      // Build zoom presets dynamically based on capabilities
      const presets = [];
      if (this.minZoom <= 0.6) presets.push(0.5);
      presets.push(1.0); // Default 1x
      if (this.maxZoom >= 2.0) presets.push(2.0);
      if (this.maxZoom >= 3.0) presets.push(3.0);
      if (this.maxZoom >= 5.0) presets.push(5.0);
      this.zoomPresets = presets;

      this.renderZoomButtons();
      this.setZoom(1.0, false);
      this.setupGestures();
    },

    renderZoomButtons() {
      const container = document.getElementById('mobileZoomPillSelector');
      if (!container) return;

      container.innerHTML = '';
      this.zoomPresets.forEach(preset => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-zoom', preset);
        btn.textContent = preset < 1 ? `.${Math.round(preset * 10)}` : `${preset}x`;
        btn.className = `mobile-zoom-btn w-9 h-9 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
          Math.abs(preset - this.currentZoom) < 0.05
            ? 'bg-emerald-400 text-slate-950 font-black shadow-[0_0_14px_rgba(52,211,153,0.65)] scale-105'
            : 'text-white/85 hover:text-white bg-transparent hover:bg-white/10'
        }`;
        btn.onclick = (e) => {
          e.stopPropagation();
          this.setZoom(preset, true);
        };
        container.appendChild(btn);
      });

      // Update slider bounds & labels
      const slider = document.getElementById('mobileZoomSlider');
      const minLabel = document.getElementById('mobileZoomSliderMinLabel');
      const maxLabel = document.getElementById('mobileZoomSliderMaxLabel');

      if (slider) {
        slider.min = this.minZoom;
        slider.max = this.maxZoom;
        slider.step = this.step;
        slider.value = this.currentZoom;
      }
      if (minLabel) minLabel.textContent = `${this.minZoom}x`;
      if (maxLabel) maxLabel.textContent = `${this.maxZoom}x`;
    },

    async setZoom(val, showSliderBriefly = true) {
      const targetZoom = Math.min(Math.max(val, this.minZoom), this.maxZoom);
      this.currentZoom = Number(targetZoom.toFixed(1));

      // 1. Native hardware sensor zoom via track.applyConstraints
      if (this.hasNativeZoom && CameraManager.stream) {
        const track = CameraManager.stream.getVideoTracks()[0];
        if (track) {
          try {
            await track.applyConstraints({ advanced: [{ zoom: this.currentZoom }] });
          } catch (err) {
            console.warn('[MobileScanner] Hardware sensor zoom failed, using fallback:', err);
          }
        }
      }

      // 2. CSS transform scale on video element for smooth visual zoom
      const videoEl = document.getElementById('mobileCameraVideo');
      if (videoEl) {
        if (!this.hasNativeZoom) {
          videoEl.style.transform = `scale(${this.currentZoom})`;
          videoEl.style.transformOrigin = 'center center';
          videoEl.style.transition = 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)';
        } else {
          videoEl.style.transform = 'none';
        }
      }

      // 3. Update Zoom UI buttons
      const buttons = document.querySelectorAll('.mobile-zoom-btn');
      buttons.forEach(btn => {
        const preset = parseFloat(btn.getAttribute('data-zoom'));
        if (Math.abs(preset - this.currentZoom) < 0.05) {
          btn.className = 'mobile-zoom-btn w-9 h-9 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer bg-emerald-400 text-slate-950 font-black shadow-[0_0_14px_rgba(52,211,153,0.65)] scale-105';
        } else {
          btn.className = 'mobile-zoom-btn w-9 h-9 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer text-white/85 hover:text-white bg-transparent hover:bg-white/10';
        }
      });

      // 4. Update HUD Floating Zoom Badge
      const badge = document.getElementById('mobileZoomFloatingBadge');
      if (badge) {
        badge.textContent = `${this.currentZoom}x`;
        badge.classList.remove('opacity-0', 'pointer-events-none');
        badge.classList.add('opacity-100');

        if (this.badgeTimeout) clearTimeout(this.badgeTimeout);
        this.badgeTimeout = setTimeout(() => {
          badge.classList.remove('opacity-100');
          badge.classList.add('opacity-0', 'pointer-events-none');
        }, 1400);
      }

      // 5. Update slider value
      const slider = document.getElementById('mobileZoomSlider');
      if (slider) {
        slider.value = this.currentZoom;
      }

      // 6. Show continuous slider if requested
      if (showSliderBriefly) {
        this.showSliderTemporary();
      }
    },

    showSliderTemporary() {
      const sliderBox = document.getElementById('mobileZoomSliderContainer');
      if (!sliderBox) return;

      sliderBox.classList.remove('hidden', 'opacity-0');
      sliderBox.classList.add('opacity-100');

      if (this.sliderTimeout) clearTimeout(this.sliderTimeout);
      this.sliderTimeout = setTimeout(() => {
        sliderBox.classList.remove('opacity-100');
        sliderBox.classList.add('opacity-0');
        setTimeout(() => sliderBox.classList.add('hidden'), 250);
      }, 2200);
    },

    reset() {
      this.currentZoom = 1.0;
      const videoEl = document.getElementById('mobileCameraVideo');
      if (videoEl) videoEl.style.transform = 'none';

      const sliderBox = document.getElementById('mobileZoomSliderContainer');
      if (sliderBox) sliderBox.classList.add('hidden', 'opacity-0');

      const badge = document.getElementById('mobileZoomFloatingBadge');
      if (badge) badge.classList.add('opacity-0', 'pointer-events-none');
    },

    setupGestures() {
      if (this.listenersAttached) return;
      this.listenersAttached = true;

      const overlay = document.getElementById('mobileLiveCameraOverlay');
      if (!overlay) return;

      // Pinch-to-zoom touch listeners
      overlay.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          this.isPinching = true;
          this.initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          this.initialPinchZoom = this.currentZoom;
          this.showSliderTemporary();
        }
      }, { passive: true });

      overlay.addEventListener('touchmove', (e) => {
        if (this.isPinching && e.touches.length === 2) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          if (this.initialPinchDist > 0) {
            const factor = currentDist / this.initialPinchDist;
            const newZoom = this.initialPinchZoom * factor;
            this.setZoom(newZoom, true);
          }
        }
      }, { passive: true });

      const endPinch = () => {
        this.isPinching = false;
      };
      overlay.addEventListener('touchend', endPinch, { passive: true });
      overlay.addEventListener('touchcancel', endPinch, { passive: true });

      // Continuous slider input listener
      const slider = document.getElementById('mobileZoomSlider');
      if (slider) {
        slider.addEventListener('input', (e) => {
          this.setZoom(parseFloat(e.target.value), false);
        });
      }
    }
  };

  // ─── 3. CAMERA MANAGER ───────────────────────────────────────────────────
  const CameraManager = {
    stream: null,
    facingMode: 'environment', // Back camera by default
    isFlashOn: false,
    hasTorchCapability: false,

    async startCamera() {
      if (window.innerWidth >= 768) return; // Mobile only
      this.stopCamera();

      const videoEl = document.getElementById('mobileCameraVideo');
      const flashBtn = document.getElementById('mobileCamFlashBtn');
      const statusText = document.getElementById('mobileCamStatusText');

      if (statusText) {
        const total = Images.scannedImages.length;
        if (total > 0) {
          const nextSlotNum = Math.min(total + 1, 6);
          statusText.textContent = `Panel ${nextSlotNum}: Align inside box`;
        } else {
          statusText.textContent = 'Align package label inside the box';
        }
      }

      // Add body lock class and hide bottom dock for true fullscreen camera experience
      document.body.classList.add('mobile-cam-open');
      const bottomNav = document.getElementById('mobileBottomNavInspector');
      if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');

      const constraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      try {
        let stream = null;
        try {
          const getStreamPromise = navigator.mediaDevices.getUserMedia(constraints);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Camera request timed out')), 5000)
          );
          stream = await Promise.race([getStreamPromise, timeoutPromise]);
        } catch (resErr) {
          // Fallback without resolution constraint if device camera was overconstrained
          console.warn('[MobileScanner] Initial camera constraints fallback:', resErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: this.facingMode } },
            audio: false
          });
        }

        this.stream = stream;

        if (videoEl) {
          videoEl.srcObject = this.stream;
          await videoEl.play().catch(e => console.warn('[MobileScanner] Video play warning:', e));
        }

        // Initialize ZoomManager with the camera track
        const track = this.stream.getVideoTracks()[0];
        ZoomManager.init(track);

        // Detect flash/torch support on active video track
        if (track && typeof track.getCapabilities === 'function') {
          const capabilities = track.getCapabilities();
          this.hasTorchCapability = Boolean(capabilities && capabilities.torch);
        } else {
          this.hasTorchCapability = false;
        }

        if (flashBtn) {
          if (this.hasTorchCapability) {
            flashBtn.classList.remove('opacity-30', 'cursor-not-allowed');
            flashBtn.removeAttribute('disabled');
            flashBtn.title = 'Toggle Flashlight';
          } else {
            flashBtn.classList.add('opacity-30', 'cursor-not-allowed');
            flashBtn.setAttribute('disabled', 'true');
            flashBtn.title = 'Flashlight unavailable on this camera lens';
          }
          if (this.isFlashOn) {
            flashBtn.classList.add('flash-active');
            flashBtn.setAttribute('aria-pressed', 'true');
          } else {
            flashBtn.classList.remove('flash-active');
            flashBtn.setAttribute('aria-pressed', 'false');
          }
        }

        this.updateDockThumbnails();

        if (statusText) {
          const total = Images.scannedImages.length;
          if (total > 0) {
            statusText.textContent = `Panel ${total + 1}: Align inside box`;
          } else {
            statusText.textContent = 'Align package label inside the box';
          }
        }

        Scanner.startScanning();
      } catch (err) {
        console.warn('[MobileScanner] Camera access failed:', err);
        if (statusText) statusText.textContent = 'Camera unavailable. Please use Gallery.';
        if (typeof window.showToast === 'function') {
          window.showToast('Unable to open camera. Please grant permission or choose Gallery.', 'warning');
        }
      }
    },

    updateDockThumbnails() {
      const countBadge = document.getElementById('mobileCamCountBadge');
      const reviewThumb = document.getElementById('mobileCamReviewMiniThumb');
      const reviewIcon = document.getElementById('mobileCamReviewDefaultIcon');
      const reviewLabel = document.getElementById('mobileCamReviewLabel');
      const total = Images.scannedImages.length;

      if (countBadge) {
        if (total > 0) {
          countBadge.textContent = `${total} captured`;
          countBadge.classList.remove('hidden');
        } else {
          countBadge.classList.add('hidden');
        }
      }

      if (total > 0) {
        if (reviewThumb) {
          reviewThumb.src = Images.scannedImages[total - 1];
          reviewThumb.classList.remove('hidden');
        }
        if (reviewIcon) reviewIcon.classList.add('hidden');
        if (reviewLabel) reviewLabel.textContent = `Review (${total})`;
      } else {
        if (reviewThumb) reviewThumb.classList.add('hidden');
        if (reviewIcon) reviewIcon.classList.remove('hidden');
        if (reviewLabel) reviewLabel.textContent = 'Review';
      }
    },

    stopCamera() {
      Scanner.stopScanning();
      ZoomManager.reset();

      if (this.stream) {
        try {
          if (this.isFlashOn) {
            const track = this.stream.getVideoTracks()[0];
            if (track) track.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
            this.isFlashOn = false;
          }
          this.stream.getTracks().forEach(t => {
            try { t.stop(); } catch (err) {}
          });
        } catch (e) {
          console.warn('[MobileScanner] Error stopping tracks:', e);
        }
        this.stream = null;
      }
      const flashBtn = document.getElementById('mobileCamFlashBtn');
      if (flashBtn) {
        flashBtn.classList.remove('flash-active');
        flashBtn.setAttribute('aria-pressed', 'false');
      }
      const videoEl = document.getElementById('mobileCameraVideo');
      if (videoEl) videoEl.srcObject = null;
      document.body.classList.remove('mobile-cam-open');
      const bottomNav = document.getElementById('mobileBottomNavInspector');
      if (bottomNav) bottomNav.style.removeProperty('display');
    },

    async switchCamera() {
      const switchBtn = document.getElementById('mobileCamSwitchBtn');
      if (switchBtn) {
        const svg = switchBtn.querySelector('svg');
        if (svg) {
          svg.style.transform = svg.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      }
      if (this.isFlashOn && this.stream) {
        try {
          const track = this.stream.getVideoTracks()[0];
          if (track) await track.applyConstraints({ advanced: [{ torch: false }] });
        } catch (e) {}
        this.isFlashOn = false;
      }
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
      await this.startCamera();
      if (typeof window.showToast === 'function') {
        window.showToast(this.facingMode === 'environment' ? 'Switched to Back Camera (Lens: Back)' : 'Switched to Front Camera (Lens: User)', 'info');
      }
    },

    async toggleFlash() {
      if (!this.stream) return;
      const track = this.stream.getVideoTracks()[0];
      if (!track || !this.hasTorchCapability) {
        if (typeof window.showToast === 'function') {
          window.showToast('Torch/Flashlight is not supported on this camera lens', 'info');
        }
        return;
      }

      const nextFlashState = !this.isFlashOn;
      try {
        await track.applyConstraints({ advanced: [{ torch: nextFlashState }] });
        this.isFlashOn = nextFlashState;
        const flashBtn = document.getElementById('mobileCamFlashBtn');
        if (flashBtn) {
          if (this.isFlashOn) {
            flashBtn.classList.add('flash-active');
            flashBtn.setAttribute('aria-pressed', 'true');
          } else {
            flashBtn.classList.remove('flash-active');
            flashBtn.setAttribute('aria-pressed', 'false');
          }
        }
        if (typeof window.showToast === 'function') {
          window.showToast(this.isFlashOn ? 'Flashlight ON' : 'Flashlight OFF', 'info');
        }
      } catch (err) {
        console.warn('[MobileScanner] Failed to toggle torch:', err);
        if (typeof window.showToast === 'function') {
          window.showToast('Unable to toggle flashlight on this lens', 'warning');
        }
      }
    },

    closeCamera() {
      this.stopCamera();
      if (Images.scannedImages.length > 0) {
        UI.showImagePreview();
      } else {
        UI.showScannerOptions();
      }
    }
  };

  // ─── 4. SCANNER LOGIC ─────────────────────────────────────────────────────
  const Scanner = {
    barcodeDetector: null,
    scanInterval: null,
    isDetecting: false,
    hasAutoCaptured: false,

    startScanning() {
      this.stopScanning();
      this.hasAutoCaptured = false;

      if ('BarcodeDetector' in window) {
        try {
          this.barcodeDetector = new window.BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'upc_a', 'upc_e']
          });
        } catch (e) {
          this.barcodeDetector = null;
        }
      }

      // Check video frames periodically for automatic barcode/QR detection
      if (this.barcodeDetector) {
        const videoEl = document.getElementById('mobileCameraVideo');
        this.scanInterval = setInterval(async () => {
          if (!videoEl || videoEl.readyState < 2 || this.isDetecting || this.hasAutoCaptured) return;
          this.isDetecting = true;
          try {
            const barcodes = await this.barcodeDetector.detect(videoEl);
            if (barcodes && barcodes.length > 0 && !this.hasAutoCaptured) {
              this.hasAutoCaptured = true;
              const code = barcodes[0].rawValue;
              console.log('[MobileScanner] Auto-detected code:', code);
              
              // Transition reticle corners to Solid Emerald & trigger haptic pulse
              const reticle = document.getElementById('mobileViewfinderGuide');
              if (reticle) reticle.classList.add('detected');
              if (typeof navigator.vibrate === 'function') {
                try { navigator.vibrate(50); } catch (e) {}
              }

              const statusText = document.getElementById('mobileCamStatusText');
              if (statusText) statusText.textContent = `Barcode detected: ${code}`;
              // Trigger instant capture on detection
              this.handleScan();
            }
          } catch (e) {
            // Frame detection skipped
          } finally {
            this.isDetecting = false;
          }
        }, 350);
      }
    },

    stopScanning() {
      if (this.scanInterval) {
        clearInterval(this.scanInterval);
        this.scanInterval = null;
      }
      this.isDetecting = false;
      const reticle = document.getElementById('mobileViewfinderGuide');
      if (reticle) reticle.classList.remove('detected');
    },

    handleScan() {
      const videoEl = document.getElementById('mobileCameraVideo');
      if (!videoEl || !CameraManager.stream) {
        if (typeof window.showToast === 'function') {
          window.showToast('Camera feed not ready to capture', 'warning');
        }
        return;
      }

      // Capture frame onto canvas
      const width = videoEl.videoWidth || 1280;
      const height = videoEl.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Check if visual fallback zoom was applied
      const zoom = ZoomManager.currentZoom;
      if (!ZoomManager.hasNativeZoom && zoom > 1.0) {
        const sw = width / zoom;
        const sh = height / zoom;
        const sx = (width - sw) / 2;
        const sy = (height - sh) / 2;
        ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, width, height);
      } else {
        ctx.drawImage(videoEl, 0, 0, width, height);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // Play native audio click feedback
      playNativeShutterSound();

      // Screen flash feedback
      const flashOverlay = document.getElementById('mobileCamFlashEffect');
      if (flashOverlay) {
        flashOverlay.classList.remove('hidden');
        flashOverlay.style.opacity = '0.9';
        setTimeout(() => {
          flashOverlay.style.opacity = '0';
          setTimeout(() => flashOverlay.classList.add('hidden'), 150);
        }, 60);
      }

      // Haptic feedback
      if (typeof navigator.vibrate === 'function') {
        try { navigator.vibrate([40]); } catch (e) {}
      }

      Images.lastSource = 'camera';
      this.addImage(dataUrl);
    },

    addImage(dataUrl) {
      CameraManager.stopCamera();
      Images.addImage(dataUrl);
    }
  };

  // ─── 5. UI CONTROLLER ────────────────────────────────────────────────────
  const UI = {
    showScannerOptions() {
      if (window.innerWidth >= 768) return;

      const choiceScreen = document.getElementById('mobileScannerChoiceScreen');
      const cameraOverlay = document.getElementById('mobileLiveCameraOverlay');
      const previewScreen = document.getElementById('mobileImagePreviewScreen');
      const headerBar = document.getElementById('ocrHeaderStatutoryBar');
      const mainDeck = document.getElementById('ocrMainCaptureDeck');
      const manualAccordion = document.getElementById('manualEntryAccordion');

      if (choiceScreen) choiceScreen.classList.remove('hidden');
      if (cameraOverlay) cameraOverlay.classList.add('hidden');
      if (previewScreen) previewScreen.classList.add('hidden');

      if (headerBar) headerBar.classList.add('hidden');
      if (mainDeck) mainDeck.classList.add('hidden');
      if (manualAccordion) manualAccordion.classList.add('hidden');
    },

    showCamera() {
      if (window.innerWidth >= 768) return;

      Images.lastSource = 'camera';
      const choiceScreen = document.getElementById('mobileScannerChoiceScreen');
      const cameraOverlay = document.getElementById('mobileLiveCameraOverlay');
      const previewScreen = document.getElementById('mobileImagePreviewScreen');
      const headerBar = document.getElementById('ocrHeaderStatutoryBar');
      const mainDeck = document.getElementById('ocrMainCaptureDeck');
      const manualAccordion = document.getElementById('manualEntryAccordion');

      if (choiceScreen) choiceScreen.classList.add('hidden');
      if (previewScreen) previewScreen.classList.add('hidden');
      if (cameraOverlay) cameraOverlay.classList.remove('hidden');

      if (headerBar) headerBar.classList.add('hidden');
      if (mainDeck) mainDeck.classList.add('hidden');
      if (manualAccordion) manualAccordion.classList.add('hidden');

      // Update thumbnail preview badge if images exist
      const countBadge = document.getElementById('mobileCamCountBadge');
      if (countBadge) {
        if (Images.scannedImages.length > 0) {
          countBadge.textContent = `${Images.scannedImages.length} captured`;
          countBadge.classList.remove('hidden');
        } else {
          countBadge.classList.add('hidden');
        }
      }

      CameraManager.startCamera();
    },

    showUpload() {
      if (window.innerWidth >= 768) return;

      Images.lastSource = 'upload';
      const fileInput = document.getElementById('mobileScannerFileInput');
      if (fileInput) {
        fileInput.value = '';
        fileInput.click();
      }
    },

    handleFileInputChange(e) {
      const files = Array.from(e.target.files || []);
      if (!files || files.length === 0) return;

      let loadedCount = 0;
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target.result;
          Images.scannedImages.push(dataUrl);
          loadedCount++;
          if (loadedCount === files.length) {
            Images.activeIndex = Images.scannedImages.length - 1;
            UI.showImagePreview();
          }
        };
        reader.readAsDataURL(file);
      });
    },

    showImagePreview() {
      if (window.innerWidth >= 768) return;

      CameraManager.stopCamera();

      const choiceScreen = document.getElementById('mobileScannerChoiceScreen');
      const cameraOverlay = document.getElementById('mobileLiveCameraOverlay');
      const previewScreen = document.getElementById('mobileImagePreviewScreen');
      const headerBar = document.getElementById('ocrHeaderStatutoryBar');
      const mainDeck = document.getElementById('ocrMainCaptureDeck');
      const manualAccordion = document.getElementById('manualEntryAccordion');

      if (choiceScreen) choiceScreen.classList.add('hidden');
      if (cameraOverlay) cameraOverlay.classList.add('hidden');
      if (previewScreen) previewScreen.classList.remove('hidden');

      if (headerBar) headerBar.classList.add('hidden');
      if (mainDeck) mainDeck.classList.add('hidden');
      if (manualAccordion) manualAccordion.classList.add('hidden');

      this.updatePreviewDisplay();
    },

    updatePreviewDisplay() {
      const images = Images.scannedImages;
      const countEl = document.getElementById('mobilePreviewCount');
      const activeIdxEl = document.getElementById('mobileActiveImageIndex');
      const totalIdxEl = document.getElementById('mobileTotalImageCount');
      const mainImg = document.getElementById('mobileMainPreviewImg');
      const stripContainer = document.getElementById('mobilePreviewThumbnailsStrip');
      const slotTextEl = document.getElementById('mobileActivePanelSlotText');
      const doneBtnText = document.getElementById('mobileDoneProcessingBtnText');
      const addMoreBtn = document.getElementById('mobileAddMoreImagesBtn');
      const prevBtn = document.getElementById('mobilePrevImgBtn');
      const nextBtn = document.getElementById('mobileNextImgBtn');

      const PANEL_NAMES = [
        'Panel 1 · Front (PDP)',
        'Panel 2 · Back (Declarations & MRP)',
        'Panel 3 · Left Side (Nutritional & Mfd)',
        'Panel 4 · Right Side (Customer Care & Barcode)',
        'Panel 5 · Top Cap (Batch & Date)',
        'Panel 6 · Base Panel'
      ];
      const PANEL_SHORT = ['P1 Front', 'P2 Back', 'P3 Left', 'P4 Right', 'P5 Top', 'P6 Base'];

      if (countEl) countEl.textContent = `${images.length} Image${images.length > 1 ? 's' : ''} Captured`;
      if (activeIdxEl) activeIdxEl.textContent = `${Images.activeIndex + 1}`;
      if (totalIdxEl) totalIdxEl.textContent = `${images.length}`;
      if (slotTextEl) {
        slotTextEl.textContent = PANEL_NAMES[Images.activeIndex] || `Panel ${Images.activeIndex + 1}`;
      }
      if (doneBtnText) {
        doneBtnText.textContent = `Done · Run AI Statutory Analysis (${images.length} Panel${images.length > 1 ? 's' : ''})`;
      }

      if (addMoreBtn) {
        const nextSlot = images.length < PANEL_NAMES.length ? PANEL_SHORT[images.length] : 'Panel';
        const span = addMoreBtn.querySelector('span');
        if (span) {
          span.textContent = `+ Add More Image (${nextSlot})`;
        }
      }

      if (prevBtn) {
        if (images.length > 1) {
          prevBtn.classList.remove('hidden');
        } else {
          prevBtn.classList.add('hidden');
        }
      }

      if (nextBtn) {
        if (images.length > 1) {
          nextBtn.classList.remove('hidden');
        } else {
          nextBtn.classList.add('hidden');
        }
      }

      if (mainImg && images[Images.activeIndex]) {
        mainImg.src = images[Images.activeIndex];
      }

      // Render horizontal thumbnail strip
      if (stripContainer) {
        stripContainer.innerHTML = '';
        images.forEach((imgUrl, idx) => {
          const isSelected = idx === Images.activeIndex;
          const shortName = PANEL_SHORT[idx] || `P${idx + 1}`;
          const card = document.createElement('div');
          card.className = `relative flex-shrink-0 w-20 h-24 rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-150 ${
            isSelected 
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/40 scale-[1.02]' 
              : 'border-slate-300 dark:border-slate-700/80 opacity-75 hover:opacity-100 hover:border-slate-400'
          }`;
          card.onclick = () => Images.setActiveIndex(idx);

          card.innerHTML = `
            <img src="${imgUrl}" alt="Scanned Image ${idx + 1}" class="w-full h-full object-cover">
            <div class="absolute bottom-0 inset-x-0 bg-slate-950/85 backdrop-blur-xs text-white text-[9.5px] font-mono font-bold text-center py-0.5 tracking-tight truncate px-1">
              ${shortName}
            </div>
            <button type="button" onclick="event.stopPropagation(); MobileScanner.Images.removeImage(${idx})"
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer"
              title="Remove panel">
              ✕
            </button>
          `;
          stripContainer.appendChild(card);
        });

        // Append "+ Add Panel" tile
        const addCard = document.createElement('div');
        addCard.className = 'flex-shrink-0 w-20 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400';
        addCard.onclick = () => Images.addMoreImage('camera');
        addCard.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4" />
          </svg>
          <span class="text-[9.5px] font-mono font-bold">Add Panel</span>
        `;
        stripContainer.appendChild(addCard);
      }
    },

    showResult() {
      if (Images.scannedImages.length === 0) {
        if (typeof window.showToast === 'function') {
          window.showToast('Please capture or upload at least one image before continuing', 'warning');
        }
        return;
      }

      CameraManager.stopCamera();

      // Hide all mobile wizard views
      const choiceScreen = document.getElementById('mobileScannerChoiceScreen');
      const cameraOverlay = document.getElementById('mobileLiveCameraOverlay');
      const previewScreen = document.getElementById('mobileImagePreviewScreen');
      if (choiceScreen) choiceScreen.classList.add('hidden');
      if (cameraOverlay) cameraOverlay.classList.add('hidden');
      if (previewScreen) previewScreen.classList.add('hidden');

      // Populate panelImages array in scanner.js
      if (typeof window.panelImages !== 'undefined' && window.PANEL_SLOTS) {
        const slots = window.PANEL_SLOTS;
        slots.forEach((s) => { window.panelImages[s] = null; });
        Images.scannedImages.forEach((imgUrl, i) => {
          if (i < slots.length) {
            window.panelImages[slots[i]] = imgUrl;
          }
        });
        window.currentUploadedImageDataUrl = Images.scannedImages[0];
        if (typeof window.updateMultiPanelState === 'function') {
          window.updateMultiPanelState();
        }
      } else {
        window.currentUploadedImageDataUrl = Images.scannedImages[0];
      }

      // Smooth scroll to loading section
      const loadingSection = document.getElementById('ocrLoadingSection');
      if (loadingSection) {
        loadingSection.classList.remove('hidden');
        loadingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Start statutory AI analysis directly
      if (typeof window.startAiOcrInspection === 'function') {
        window.startAiOcrInspection();
      }
    }
  };

  // ─── 6. GLOBAL EXPORT & DESKTOP SAFEGUARD ────────────────────────────────
  window.MobileScanner = {
    ZoomManager,
    CameraManager,
    Scanner,
    Images,
    UI
  };

  // Expose global shorthand callers matching existing buttons
  window.selectMobileScannerChoice = function (method) {
    if (method === 'camera') {
      UI.showCamera();
    } else if (method === 'upload') {
      UI.showUpload();
    }
  };

  window.returnToMobileScannerChoice = function () {
    CameraManager.stopCamera();
    UI.showScannerOptions();
  };

  // Attach mobile file input listener
  document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('mobileScannerFileInput');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => UI.handleFileInputChange(e));
    }
  });

  // Ensure desktop layout is fully restored when resizing above 768px
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      CameraManager.stopCamera();
      const choiceScreen = document.getElementById('mobileScannerChoiceScreen');
      const cameraOverlay = document.getElementById('mobileLiveCameraOverlay');
      const previewScreen = document.getElementById('mobileImagePreviewScreen');
      const headerBar = document.getElementById('ocrHeaderStatutoryBar');
      const mainDeck = document.getElementById('ocrMainCaptureDeck');
      const manualAccordion = document.getElementById('manualEntryAccordion');

      if (choiceScreen) choiceScreen.classList.add('hidden');
      if (cameraOverlay) cameraOverlay.classList.add('hidden');
      if (previewScreen) previewScreen.classList.add('hidden');
      if (headerBar) headerBar.classList.remove('hidden');
      if (mainDeck) mainDeck.classList.remove('hidden');
      if (manualAccordion) manualAccordion.classList.remove('hidden');
    }
  }, { passive: true });

})(window, document);
