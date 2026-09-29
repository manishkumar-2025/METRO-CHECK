/* ==========================================================================
   METRO-CHECK — Global Demo Mode Engine (js/demo-mode.js)
   Legal Metrology Compliance Verification System
   Version 3.1 — Fully Harmonized Schema & 7 Verified Demo Cases
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_FLAG_KEY = 'metro_demo_mode_active';
  var DEMO_IMG_BASE = 'demo/image/';

  /* ── 7 Verified Demo Cases strictly mapped to public/demo/image/ ───────── */
  var DEMO_CASES = [
    {
      id: 'DEMO-LM/WZ/20260929/00001-D3M0',
      sequenceNumber: 901,
      evidenceId: 'EVD-DEMO-LM-WZ-20260929-00001-D3M0',
      commodity: 'Stationery — Exercise Note Book',
      brand: 'Navneet Education Limited',
      product: 'Navneet Youva Note Book (76 Pages)',
      productName: 'Navneet Youva Note Book (76 Pages)',
      netQuantity: '1 N (76 Pages, 15.5cm × 18.8cm)',
      mrp: '25.00',
      mrpText: '₹25.00 (incl. of all taxes)',
      unitSalePrice: '₹25.00 Per Number',
      manufactureDate: null,
      expiryDate: 'N/A (Stationery)',
      batchNumber: '23295',
      barcodeNumber: '8190244 12225824',
      licenseNo: 'N/A',
      fssaiLicNo: 'N/A (Stationery)',
      manufacturerAddress: 'Navneet Education Limited, Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028, Maharashtra',
      countryOfOrigin: null,
      extractedText: 'MRP: ₹25.00 (incl. of all taxes) | 76 Pages | Note Book Sketch | 1 Side Ruled / 1 Side Plain | Regular Size 15.5cm X 18.8cm | NAVNEET EDUCATION LIMITED | Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028 | Customer Care: 022 66626300 | care@navneet.com | Qty: 1 N | Code: 23295',
      extractedData: {
        commodity_name: 'Navneet Youva Note Book (Sketch)',
        generic_name: 'Note Book (Sketch)',
        product_name: 'Navneet Youva Note Book (Sketch)',
        net_quantity: '1 N (76 Pages, 15.5cm × 18.8cm)',
        net_weight: '1 N (76 Pages)',
        mrp: '25.00',
        mrp_tax_inclusive: '25.00',
        unit_sale_price: '₹25.00 Per Number',
        usp: '₹25.00 Per Number',
        manufacturer: 'Navneet Education Limited, Dadar (West), Mumbai 400 028',
        manufacturer_name: 'Navneet Education Limited',
        manufacturer_address: 'Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028, Maharashtra',
        manufacturer_packer: 'Navneet Education Limited, Mumbai',
        manufacturer_name_address: 'Navneet Education Limited, Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Customer Care: 022 66626300 | care@navneet.com',
        consumer_care_contact: 'Customer Care: 022 66626300 | care@navneet.com',
        customer_care: '022 66626300',
        helpline: '022 66626300',
        best_before: 'N/A (Stationery)',
        expiry_date: 'N/A',
        batch_no: '23295',
        lot_no: '23295',
        batch_number: '23295',
        country_of_origin: null,
        fssai_no: 'N/A (Stationery)',
        license_no: 'N/A'
      },
      originalExtractedData: {
        commodity_name: 'Navneet Youva Note Book (Sketch)',
        generic_name: 'Note Book (Sketch)',
        product_name: 'Navneet Youva Note Book (Sketch)',
        net_quantity: '1 N (76 Pages, 15.5cm × 18.8cm)',
        net_weight: '1 N (76 Pages)',
        mrp: '25.00',
        mrp_tax_inclusive: '25.00',
        unit_sale_price: '₹25.00 Per Number',
        usp: '₹25.00 Per Number',
        manufacturer: 'Navneet Education Limited, Dadar (West), Mumbai 400 028',
        manufacturer_name: 'Navneet Education Limited',
        manufacturer_address: 'Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028, Maharashtra',
        manufacturer_packer: 'Navneet Education Limited, Mumbai',
        manufacturer_name_address: 'Navneet Education Limited, Navneet Bhavan, Bhavani Shankar Road, Dadar (West), Mumbai 400 028',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Customer Care: 022 66626300 | care@navneet.com',
        consumer_care_contact: 'Customer Care: 022 66626300 | care@navneet.com',
        customer_care: '022 66626300',
        helpline: '022 66626300',
        best_before: 'N/A (Stationery)',
        expiry_date: 'N/A',
        batch_no: '23295',
        lot_no: '23295',
        batch_number: '23295',
        country_of_origin: null,
        fssai_no: 'N/A (Stationery)',
        license_no: 'N/A'
      },
      overallStatus: 'NON_COMPLIANT',
      status: 'NON_COMPLIANT',
      isCompliant: false,
      violations: [
        'Country of Origin not declared on label (Rule 6(1)(d), PC Rules 2011 [Demo])',
        'Month and year of manufacture absent on label (Rule 6(1)(e), PC Rules 2011 [Demo])',
        'Declarations printed only on spine; principal display panel lacks mandatory fields [Demo]'
      ],
      complianceViolations: [
        'Country of Origin not declared on label (Rule 6(1)(d), PC Rules 2011 [Demo])',
        'Month and year of manufacture absent on label (Rule 6(1)(e), PC Rules 2011 [Demo])',
        'Declarations printed only on spine; principal display panel lacks mandatory fields [Demo]'
      ],
      inspectorNotes: 'Mandatory Country of Origin and MFD declarations are not found on the packaging label. Submitted for enforcement review. [Demo Record]',
      remarks: 'Mandatory Country of Origin and MFD declarations are not found on the packaging label. Submitted for enforcement review. [Demo Record]',
      reviewComments: 'Confirmed Rule 6 non-compliance: Country of Origin missing. Show Cause Notice Form-V issued under Section 36(1). [Demo Record]',
      officerComments: 'Confirmed Rule 6 non-compliance: Country of Origin missing. Show Cause Notice Form-V issued under Section 36(1). [Demo Record]',
      officerRemarks: 'Confirmed Rule 6 non-compliance: Country of Origin missing. Show Cause Notice Form-V issued under Section 36(1). [Demo Record]',
      zone: 'West',
      state: 'Maharashtra',
      location: 'Dadar Wholesale Market, Mumbai',
      priority: 'Urgent',
      commodityCategory: 'Stationery / Educational Goods',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 98,
      inspectorId: 'demo_insp_01',
      inspectorName: 'Shri Ravi Sharma',
      inspector: 'Shri Ravi Sharma',
      inspectorBadgeNumber: 'LMI-WZ-2026-901',
      inspectorDesignation: 'Field Inspector (West Zone)',
      inspectorOffice: 'Office of ACLM, Dadar Division, Mumbai, Maharashtra',
      officerAssigned: 'demo_officer_wz',
      officerName: 'Smt. Priya Mehta',
      officerBadgeNumber: 'LMO-WZ-2026-088',
      officerDesignation: 'Enforcement Officer (West Zone)',
      officerOffice: 'Directorate of Legal Metrology, Mumbai Zonal Office',
      createdAt: '2026-09-29T06:10:00.000Z',
      updatedAt: '2026-09-29T08:45:00.000Z',
      date: '2026-09-29',
      time: '11:40:00 AM',
      formattedDateTime: '29 Sep 2026, 11:40 AM',
      primaryImage: DEMO_IMG_BASE + 'img-1 (1).jpg',
      image: DEMO_IMG_BASE + 'img-1 (1).jpg',
      imageFront: DEMO_IMG_BASE + 'img-1 (1).jpg',
      imageBack: null,
      images: [DEMO_IMG_BASE + 'img-1 (1).jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-1 (1).jpg' },
      auditTrail: [
        { id: 'AUD-demo001a', timestamp: '2026-09-29T06:10:00.000Z', formattedTime: '29 Sep 2026, 11:40:00 AM', action: 'CASE_INITIALIZED', actor: 'Shri Ravi Sharma', role: 'Field Inspector', notes: 'Inspection docket initiated for Navneet Youva Note Book. [Demo]' },
        { id: 'AUD-demo001b', timestamp: '2026-09-29T08:45:00.000Z', formattedTime: '29 Sep 2026, 02:15:00 PM', action: 'NOTICE_ISSUED', actor: 'Smt. Priya Mehta', role: 'Enforcement Officer', notes: 'Form-V Show Cause Notice issued for absent Country of Origin and MFD. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'NON_COMPLIANT' }
      ],
      notices: [
        { id: 'DEMO-NOTICE-WZ-2026-001', noticeRef: 'LM/NOTICE/DEMO-LM-WZ-20260929-00001', issuedAt: '2026-09-29T08:45:00.000Z', noticeType: 'SHOW_CAUSE', issuedBy: 'Smt. Priya Mehta', content: 'Show Cause Notice issued under Section 36(1) for Rule 6(1)(d) absence of Country of Origin declaration. [Demo Notice]' }
      ],
      noticeRef: 'LM/NOTICE/DEMO-LM-WZ-20260929-00001',
      noticeIssuedAt: '2026-09-29T08:45:00.000Z',
      docketHash: 'a1f49e0c8b2d735160ef94125bca98231048756c3de21890f54317a6c9820001',
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T08:45:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/NZ/20260929/00002-D3M0',
      sequenceNumber: 902,
      evidenceId: 'EVD-DEMO-LM-NZ-20260929-00002-D3M0',
      commodity: 'Beverage — Ready-to-Serve Mango Fruit Drink',
      brand: 'Maaza (The Coca-Cola Company)',
      product: 'Maaza Mango (Ready-to-Serve Fruit Drink)',
      productName: 'Maaza Mango (Ready-to-Serve Fruit Drink)',
      netQuantity: '1.75 L',
      mrp: null,
      mrpText: 'See Neck (Not printed on label body)',
      unitSalePrice: null,
      manufactureDate: 'See Neck',
      expiryDate: 'See Neck',
      batchNumber: 'See Neck',
      barcodeNumber: '8 901764 092152',
      licenseNo: 'PWM Reg No.: BO-09-000-06-AAACM1635J-22',
      fssaiLicNo: '10012051000360',
      manufacturerAddress: 'Moon Beverages Limited, 2B/1, Ecotech III, Udyog Kendra, Greater Noida, UP – 201308',
      countryOfOrigin: 'Made in India',
      extractedText: 'MAAZA Mango | Ready-to-Serve Fruit Drink | NET QUANTITY: 1.75 L | MINIMUM WEIGHT 59.40g | FSSAI Lic. No. 10012051000360 | MFG BY: MOON BEVERAGES LIMITED, GREATER NOIDA, UP 201308 | MRP, MFD, EXP, BATCH: SEE NECK | MADE IN INDIA | Consumer Helpline: 1800-208-2653',
      extractedData: {
        commodity_name: 'Maaza Mango Ready-to-Serve Fruit Drink',
        generic_name: 'Ready-to-Serve Fruit Drink',
        product_name: 'Maaza Mango Ready-to-Serve Fruit Drink',
        net_quantity: '1.75 L',
        net_weight: '1.75 L (Bottle Tare 59.40g)',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Moon Beverages Limited, Greater Noida, UP 201308',
        manufacturer_name: 'Moon Beverages Limited',
        manufacturer_address: '2B/1, Ecotech III, Udyog Kendra, Greater Noida, UP – 201308',
        manufacturer_packer: 'Moon Beverages Limited, Greater Noida',
        manufacturer_name_address: 'Moon Beverages Limited, 2B/1, Ecotech III, Udyog Kendra, Greater Noida, UP – 201308',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Helpline: 1800-208-2653 | indiahelpline@coca-cola.com',
        consumer_care_contact: 'Helpline: 1800-208-2653 | indiahelpline@coca-cola.com',
        customer_care: '1800-208-2653',
        helpline: '1800-208-2653',
        best_before: 'See Neck',
        expiry_date: 'See Neck',
        batch_no: 'See Neck',
        lot_no: 'See Neck',
        batch_number: 'See Neck',
        country_of_origin: 'Made in India',
        fssai_no: '10012051000360',
        license_no: 'PWM Reg: BO-09-000-06-AAACM1635J-22'
      },
      originalExtractedData: {
        commodity_name: 'Maaza Mango Ready-to-Serve Fruit Drink',
        generic_name: 'Ready-to-Serve Fruit Drink',
        product_name: 'Maaza Mango Ready-to-Serve Fruit Drink',
        net_quantity: '1.75 L',
        net_weight: '1.75 L (Bottle Tare 59.40g)',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Moon Beverages Limited, Greater Noida, UP 201308',
        manufacturer_name: 'Moon Beverages Limited',
        manufacturer_address: '2B/1, Ecotech III, Udyog Kendra, Greater Noida, UP – 201308',
        manufacturer_packer: 'Moon Beverages Limited, Greater Noida',
        manufacturer_name_address: 'Moon Beverages Limited, 2B/1, Ecotech III, Udyog Kendra, Greater Noida, UP – 201308',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Helpline: 1800-208-2653 | indiahelpline@coca-cola.com',
        consumer_care_contact: 'Helpline: 1800-208-2653 | indiahelpline@coca-cola.com',
        customer_care: '1800-208-2653',
        helpline: '1800-208-2653',
        best_before: 'See Neck',
        expiry_date: 'See Neck',
        batch_no: 'See Neck',
        lot_no: 'See Neck',
        batch_number: 'See Neck',
        country_of_origin: 'Made in India',
        fssai_no: '10012051000360',
        license_no: 'PWM Reg: BO-09-000-06-AAACM1635J-22'
      },
      overallStatus: 'UNDER_REVIEW',
      status: 'UNDER_REVIEW',
      isCompliant: false,
      violations: [
        'MRP not printed on label panel body — references bottle neck seal (Rule 6(1)(f), PC Rules 2011 [Demo])',
        'MFD, Best Before, and Batch No. referred to neck; pending secondary neck photo verification [Demo]'
      ],
      complianceViolations: [
        'MRP not printed on label panel body — references bottle neck seal (Rule 6(1)(f), PC Rules 2011 [Demo])',
        'MFD, Best Before, and Batch No. referred to neck; pending secondary neck photo verification [Demo]'
      ],
      inspectorNotes: 'MRP and date markings are referenced to the bottle neck. Front/back body labels captured. Pending secondary neck verification. [Demo Record]',
      remarks: 'MRP and date markings are referenced to the bottle neck. Front/back body labels captured. Pending secondary neck verification. [Demo Record]',
      reviewComments: 'Under active judicial review. Inspector instructed to provide verified photograph of laser etching on neck seal. [Demo Record]',
      officerComments: 'Under active judicial review. Inspector instructed to provide verified photograph of laser etching on neck seal. [Demo Record]',
      officerRemarks: 'Under active judicial review. Inspector instructed to provide verified photograph of laser etching on neck seal. [Demo Record]',
      zone: 'North',
      state: 'Uttar Pradesh',
      location: 'Ecotech Retail Hub, Greater Noida',
      priority: 'Standard',
      commodityCategory: 'Beverages / Ready-to-Serve Drinks',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 96,
      inspectorId: 'demo_insp_02',
      inspectorName: 'Smt. Neha Verma',
      inspector: 'Smt. Neha Verma',
      inspectorBadgeNumber: 'LMI-NZ-2026-902',
      inspectorDesignation: 'Field Inspector (North Zone)',
      inspectorOffice: 'Office of ACLM, Gautam Buddha Nagar Division, UP',
      officerAssigned: 'demo_officer_nz',
      officerName: 'Shri Arjun Singh',
      officerBadgeNumber: 'LMO-NZ-2026-045',
      officerDesignation: 'Senior Enforcement Officer (North Zone)',
      officerOffice: 'Regional Directorate of Legal Metrology, New Delhi',
      createdAt: '2026-09-29T06:30:00.000Z',
      updatedAt: '2026-09-29T10:00:00.000Z',
      date: '2026-09-29',
      time: '12:00:00 PM',
      formattedDateTime: '29 Sep 2026, 12:00 PM',
      primaryImage: DEMO_IMG_BASE + 'img-1 (4).jpg',
      image: DEMO_IMG_BASE + 'img-1 (4).jpg',
      imageFront: DEMO_IMG_BASE + 'img-1 (4).jpg',
      imageBack: DEMO_IMG_BASE + 'img-1 (2).jpg',
      images: [DEMO_IMG_BASE + 'img-1 (4).jpg', DEMO_IMG_BASE + 'img-1 (2).jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-1 (4).jpg', back: DEMO_IMG_BASE + 'img-1 (2).jpg' },
      auditTrail: [
        { id: 'AUD-demo002a', timestamp: '2026-09-29T06:30:00.000Z', formattedTime: '29 Sep 2026, 12:00:00 PM', action: 'CASE_INITIALIZED', actor: 'Smt. Neha Verma', role: 'Field Inspector', notes: 'Inspection docket initiated for Maaza 1.75L beverage bottle. [Demo]' },
        { id: 'AUD-demo002b', timestamp: '2026-09-29T10:00:00.000Z', formattedTime: '29 Sep 2026, 03:30:00 PM', action: 'REVIEW', actor: 'Shri Arjun Singh', role: 'Enforcement Officer', notes: 'Moved to UNDER_REVIEW: Neck seal verification pending. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'UNDER_REVIEW' }
      ],
      notices: [],
      docketHash: 'b2e50f1d9c3e846271fa05236cdb09342159867d4ef32901a65428b7da930002',
      previousHash: 'a1f49e0c8b2d735160ef94125bca98231048756c3de21890f54317a6c9820001',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T10:00:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/WZ/20260929/00003-D3M0',
      sequenceNumber: 903,
      evidenceId: 'EVD-DEMO-LM-WZ-20260929-00003-D3M0',
      commodity: 'Stationery — Ball Point Pen',
      brand: 'DOMS Industries Limited',
      product: 'DOMS Trio-Matic+ Triangle Ball Point Pens (20 Numbers, Blue)',
      productName: 'DOMS Trio-Matic+ Triangle Ball Point Pens (20 Numbers, Blue)',
      netQuantity: '20 Numbers',
      mrp: '80.00',
      mrpText: '₹80.00 (incl. of all taxes)',
      unitSalePrice: '₹4.00 Per Number',
      manufactureDate: '12/2025',
      expiryDate: 'N/A (Stationery)',
      batchNumber: 'ART No. 8304',
      barcodeNumber: '8 906073 783043',
      licenseNo: 'N/A',
      fssaiLicNo: 'N/A (Stationery)',
      manufacturerAddress: 'DOMS Industries Limited, J-19, G.I.D.C., Umbergaon-396171, Dist. Valsad, Gujarat, India',
      countryOfOrigin: 'Made in India',
      extractedText: 'DOMS® TRIO-MATIC+ TRIANGLE BALL POINT PENS | NET QUANTITY: 20 Numbers | MRP: ₹80.00 (incl. of all taxes) | UNIT SALE PRICE: ₹4.00 Per Number | MFD: 12/2025 | MADE IN INDIA | DOMS INDUSTRIES LIMITED, J-19, G.I.D.C., UMBERGAON-396171, DIST. VALSAD, GUJARAT | INK: BLUE | ART NO. 8304 | Query: info@domsindia.com',
      extractedData: {
        commodity_name: 'DOMS Trio-Matic+ Triangle Ball Point Pens',
        generic_name: 'Triangle Ball Point Pens',
        product_name: 'DOMS Trio-Matic+ Triangle Ball Point Pens',
        net_quantity: '20 Numbers',
        net_weight: '20 Numbers',
        mrp: '80.00',
        mrp_tax_inclusive: '80.00',
        unit_sale_price: '₹4.00 Per Number',
        usp: '₹4.00 Per Number',
        manufacturer: 'DOMS Industries Limited, Umbergaon-396171, Gujarat',
        manufacturer_name: 'DOMS Industries Limited',
        manufacturer_address: 'J-19, G.I.D.C., Umbergaon-396171, Dist. Valsad, Gujarat, India',
        manufacturer_packer: 'DOMS Industries Limited, Gujarat',
        manufacturer_name_address: 'DOMS Industries Limited, J-19, G.I.D.C., Umbergaon-396171, Dist. Valsad, Gujarat, India',
        mfg_date: '12/2025',
        manufacturing_date: '12/2025',
        mfg_month_year: '12/2025',
        packing_date: '12/2025',
        consumer_care: 'Customer Care: 1800 274 1250 | info@domsindia.com',
        consumer_care_contact: 'Customer Care: 1800 274 1250 | info@domsindia.com',
        customer_care: '1800 274 1250',
        helpline: '1800 274 1250',
        best_before: 'N/A (Stationery)',
        expiry_date: 'N/A',
        batch_no: 'ART No. 8304',
        lot_no: 'ART No. 8304',
        batch_number: 'ART No. 8304',
        country_of_origin: 'Made in India',
        fssai_no: 'N/A (Stationery)',
        license_no: 'N/A'
      },
      originalExtractedData: {
        commodity_name: 'DOMS Trio-Matic+ Triangle Ball Point Pens',
        generic_name: 'Triangle Ball Point Pens',
        product_name: 'DOMS Trio-Matic+ Triangle Ball Point Pens',
        net_quantity: '20 Numbers',
        net_weight: '20 Numbers',
        mrp: '80.00',
        mrp_tax_inclusive: '80.00',
        unit_sale_price: '₹4.00 Per Number',
        usp: '₹4.00 Per Number',
        manufacturer: 'DOMS Industries Limited, Umbergaon-396171, Gujarat',
        manufacturer_name: 'DOMS Industries Limited',
        manufacturer_address: 'J-19, G.I.D.C., Umbergaon-396171, Dist. Valsad, Gujarat, India',
        manufacturer_packer: 'DOMS Industries Limited, Gujarat',
        manufacturer_name_address: 'DOMS Industries Limited, J-19, G.I.D.C., Umbergaon-396171, Dist. Valsad, Gujarat, India',
        mfg_date: '12/2025',
        manufacturing_date: '12/2025',
        mfg_month_year: '12/2025',
        packing_date: '12/2025',
        consumer_care: 'Customer Care: 1800 274 1250 | info@domsindia.com',
        consumer_care_contact: 'Customer Care: 1800 274 1250 | info@domsindia.com',
        customer_care: '1800 274 1250',
        helpline: '1800 274 1250',
        best_before: 'N/A (Stationery)',
        expiry_date: 'N/A',
        batch_no: 'ART No. 8304',
        lot_no: 'ART No. 8304',
        batch_number: 'ART No. 8304',
        country_of_origin: 'Made in India',
        fssai_no: 'N/A (Stationery)',
        license_no: 'N/A'
      },
      overallStatus: 'COMPLIANT',
      status: 'COMPLIANT',
      isCompliant: true,
      violations: [],
      complianceViolations: [],
      inspectorNotes: 'Full statutory compliance verified. All mandatory declarations including USP (₹4.00/N) and MFD present and legible. [Demo Record]',
      remarks: 'Full statutory compliance verified. All mandatory declarations including USP (₹4.00/N) and MFD present and legible. [Demo Record]',
      reviewComments: 'Inspection approved. All Rule 6 Legal Metrology declarations verified and valid. Case archived as compliant. [Demo Record]',
      officerComments: 'Inspection approved. All Rule 6 Legal Metrology declarations verified and valid. Case archived as compliant. [Demo Record]',
      officerRemarks: 'Inspection approved. All Rule 6 Legal Metrology declarations verified and valid. Case archived as compliant. [Demo Record]',
      zone: 'West',
      state: 'Gujarat',
      location: 'GIDC Commercial Complex, Umbergaon',
      priority: 'Low',
      commodityCategory: 'Stationery / Writing Instruments',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 99,
      inspectorId: 'demo_insp_03',
      inspectorName: 'Kumari Kavya Patel',
      inspector: 'Kumari Kavya Patel',
      inspectorBadgeNumber: 'LMI-WZ-2026-903',
      inspectorDesignation: 'Field Inspector (West Zone)',
      inspectorOffice: 'Office of ACLM, Valsad Division, Gujarat',
      officerAssigned: 'demo_officer_wz',
      officerName: 'Smt. Priya Mehta',
      officerBadgeNumber: 'LMO-WZ-2026-088',
      officerDesignation: 'Enforcement Officer (West Zone)',
      officerOffice: 'Directorate of Legal Metrology, Mumbai Zonal Office',
      createdAt: '2026-09-29T07:00:00.000Z',
      updatedAt: '2026-09-29T09:30:00.000Z',
      date: '2026-09-29',
      time: '12:30:00 PM',
      formattedDateTime: '29 Sep 2026, 12:30 PM',
      primaryImage: DEMO_IMG_BASE + 'img-2 (2).jpg',
      image: DEMO_IMG_BASE + 'img-2 (2).jpg',
      imageFront: DEMO_IMG_BASE + 'img-2 (2).jpg',
      imageBack: DEMO_IMG_BASE + 'img-2 (1).jpg',
      images: [DEMO_IMG_BASE + 'img-2 (2).jpg', DEMO_IMG_BASE + 'img-2 (1).jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-2 (2).jpg', back: DEMO_IMG_BASE + 'img-2 (1).jpg' },
      auditTrail: [
        { id: 'AUD-demo003a', timestamp: '2026-09-29T07:00:00.000Z', formattedTime: '29 Sep 2026, 12:30:00 PM', action: 'CASE_INITIALIZED', actor: 'Kumari Kavya Patel', role: 'Field Inspector', notes: 'Inspection docket initiated for DOMS Trio-Matic+ pens. [Demo]' },
        { id: 'AUD-demo003b', timestamp: '2026-09-29T09:30:00.000Z', formattedTime: '29 Sep 2026, 03:00:00 PM', action: 'APPROVED', actor: 'Smt. Priya Mehta', role: 'Enforcement Officer', notes: 'All statutory declarations verified. COMPLIANT. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'COMPLIANT' }
      ],
      notices: [],
      docketHash: 'c3f61a2e0d4f957382ab16347dec10453260978e5fa43012b76539c8eb040003',
      previousHash: 'b2e50f1d9c3e846271fa05236cdb09342159867d4ef32901a65428b7da930002',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T09:30:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/SZ/20260929/00004-D3M0',
      sequenceNumber: 904,
      evidenceId: 'EVD-DEMO-LM-SZ-20260929-00004-D3M0',
      commodity: 'Food — Milk-based Confectionery (White Chocolate)',
      brand: 'Nestlé India Limited',
      product: 'Nestlé Milkybar (White Chocolate)',
      productName: 'Nestlé Milkybar (White Chocolate)',
      netQuantity: '47.2g (42g + 5.2g Extra)',
      mrp: '40.00',
      mrpText: '₹40.00 (incl. of all taxes)',
      unitSalePrice: '₹0.85 Per g',
      manufactureDate: 'MAR/2026',
      expiryDate: 'NOV/2026',
      batchNumber: '60860454X1',
      barcodeNumber: '8 901058 861921',
      licenseNo: '44486083/LC00172588(I)/00',
      fssaiLicNo: '10012025000202',
      manufacturerAddress: 'Nestlé India Ltd., Plot No. 294/1,2,3,4 & 2970, Usgao, Goa – 403406. Mkt: Nestlé House, Jacaranda Marg, Gurugram – 122002',
      countryOfOrigin: 'Made in India',
      extractedText: 'Nestlé® Milkybar® | Milk based confectionery | NET QUANTITY: 47.2g (42g + 5.2g) | MRP ₹40.00 (incl. of all taxes) | MFD.: MAR/26 | USE BY: NOV/26 | LOT NO.: 60860454X1 | FSSAI 10012025000202 | Nestlé India Ltd., Usgao, Goa | Helpline: 1800 103 1947',
      extractedData: {
        commodity_name: 'Milkybar White Chocolate Confectionery',
        generic_name: 'Milk-based Confectionery',
        product_name: 'Milkybar White Chocolate',
        net_quantity: '47.2g (42g + 5.2g Extra)',
        net_weight: '47.2g',
        mrp: '40.00',
        mrp_tax_inclusive: '40.00',
        unit_sale_price: '₹0.85 Per g',
        usp: '₹0.85 Per g',
        manufacturer: 'Nestlé India Ltd., Usgao, Goa – 403406',
        manufacturer_name: 'Nestlé India Limited',
        manufacturer_address: 'Plot No. 294/1,2,3,4 & 2970, Usgao, Goa – 403406',
        manufacturer_packer: 'Nestlé India Ltd., Goa',
        manufacturer_name_address: 'Nestlé India Ltd., Plot No. 294/1,2,3,4 & 2970, Usgao, Goa – 403406',
        mfg_date: 'MAR/2026',
        manufacturing_date: 'MAR/2026',
        mfg_month_year: 'MAR/2026',
        packing_date: 'MAR/2026',
        consumer_care: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        consumer_care_contact: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        customer_care: '1800 103 1947',
        helpline: '1800 103 1947',
        best_before: 'NOV/2026',
        expiry_date: 'NOV/2026',
        batch_no: '60860454X1',
        lot_no: '60860454X1',
        batch_number: '60860454X1',
        country_of_origin: 'Made in India',
        fssai_no: '10012025000202',
        license_no: '44486083/LC00172588(I)/00'
      },
      originalExtractedData: {
        commodity_name: 'Milkybar White Chocolate Confectionery',
        generic_name: 'Milk-based Confectionery',
        product_name: 'Milkybar White Chocolate',
        net_quantity: '47.2g (42g + 5.2g Extra)',
        net_weight: '47.2g',
        mrp: '40.00',
        mrp_tax_inclusive: '40.00',
        unit_sale_price: '₹0.85 Per g',
        usp: '₹0.85 Per g',
        manufacturer: 'Nestlé India Ltd., Usgao, Goa – 403406',
        manufacturer_name: 'Nestlé India Limited',
        manufacturer_address: 'Plot No. 294/1,2,3,4 & 2970, Usgao, Goa – 403406',
        manufacturer_packer: 'Nestlé India Ltd., Goa',
        manufacturer_name_address: 'Nestlé India Ltd., Plot No. 294/1,2,3,4 & 2970, Usgao, Goa – 403406',
        mfg_date: 'MAR/2026',
        manufacturing_date: 'MAR/2026',
        mfg_month_year: 'MAR/2026',
        packing_date: 'MAR/2026',
        consumer_care: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        consumer_care_contact: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        customer_care: '1800 103 1947',
        helpline: '1800 103 1947',
        best_before: 'NOV/2026',
        expiry_date: 'NOV/2026',
        batch_no: '60860454X1',
        lot_no: '60860454X1',
        batch_number: '60860454X1',
        country_of_origin: 'Made in India',
        fssai_no: '10012025000202',
        license_no: '44486083/LC00172588(I)/00'
      },
      overallStatus: 'COMPLIANT',
      status: 'COMPLIANT',
      isCompliant: true,
      violations: [],
      complianceViolations: [],
      inspectorNotes: 'All mandatory declarations present and verified. Extra bonus quantity correctly declared per Rule 12. Valid FSSAI licence. [Demo Record]',
      remarks: 'All mandatory declarations present and verified. Extra bonus quantity correctly declared per Rule 12. Valid FSSAI licence. [Demo Record]',
      reviewComments: 'Fully compliant inspection verified. Statutory declarations match Legal Metrology PC Rules 2011 and FSSAI standards. [Demo Record]',
      officerComments: 'Fully compliant inspection verified. Statutory declarations match Legal Metrology PC Rules 2011 and FSSAI standards. [Demo Record]',
      officerRemarks: 'Fully compliant inspection verified. Statutory declarations match Legal Metrology PC Rules 2011 and FSSAI standards. [Demo Record]',
      zone: 'South',
      state: 'Goa',
      location: 'Usgao Industrial Area, North Goa',
      priority: 'Low',
      commodityCategory: 'Food / Confectionery',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 99,
      inspectorId: 'demo_insp_04',
      inspectorName: 'Smt. Sunita Rao',
      inspector: 'Smt. Sunita Rao',
      inspectorBadgeNumber: 'LMI-SZ-2026-904',
      inspectorDesignation: 'Field Inspector (South Zone)',
      inspectorOffice: 'Office of ACLM, Panaji Division, Goa',
      officerAssigned: 'demo_officer_sz',
      officerName: 'Shri Karthik Nair',
      officerBadgeNumber: 'LMO-SZ-2026-062',
      officerDesignation: 'Senior Enforcement Officer (South Zone)',
      officerOffice: 'Regional Directorate of Legal Metrology, Chennai',
      createdAt: '2026-09-29T07:15:00.000Z',
      updatedAt: '2026-09-29T11:00:00.000Z',
      date: '2026-09-29',
      time: '12:45:00 PM',
      formattedDateTime: '29 Sep 2026, 12:45 PM',
      primaryImage: DEMO_IMG_BASE + 'img-3 (2).jpg',
      image: DEMO_IMG_BASE + 'img-3 (2).jpg',
      imageFront: DEMO_IMG_BASE + 'img-3 (2).jpg',
      imageBack: DEMO_IMG_BASE + 'img-3 (1).jpg',
      images: [DEMO_IMG_BASE + 'img-3 (2).jpg', DEMO_IMG_BASE + 'img-3 (1).jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-3 (2).jpg', back: DEMO_IMG_BASE + 'img-3 (1).jpg' },
      auditTrail: [
        { id: 'AUD-demo004a', timestamp: '2026-09-29T07:15:00.000Z', formattedTime: '29 Sep 2026, 12:45:00 PM', action: 'CASE_INITIALIZED', actor: 'Smt. Sunita Rao', role: 'Field Inspector', notes: 'Inspection docket initiated for Nestlé Milkybar chocolate. [Demo]' },
        { id: 'AUD-demo004b', timestamp: '2026-09-29T11:00:00.000Z', formattedTime: '29 Sep 2026, 04:30:00 PM', action: 'APPROVED', actor: 'Shri Karthik Nair', role: 'Enforcement Officer', notes: 'All statutory declarations verified. COMPLIANT. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'COMPLIANT' }
      ],
      notices: [],
      docketHash: 'd4a72b3f1e5a068493bc27458efd21564371089f6ab54123c87640d9fa150004',
      previousHash: 'c3f61a2e0d4f957382ab16347dec10453260978e5fa43012b76539c8eb040003',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T11:00:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/EZ/20260929/00005-D3M0',
      sequenceNumber: 905,
      evidenceId: 'EVD-DEMO-LM-EZ-20260929-00005-D3M0',
      commodity: 'Food — Chocolate Wafer Bar (Import)',
      brand: 'Nestlé KitKat (Licensed by Nestlé Canada Inc.)',
      product: 'KitKat Wafer Bar / Gaufrette (45g)',
      productName: 'KitKat Wafer Bar / Gaufrette (45g)',
      netQuantity: '45g',
      mrp: null,
      mrpText: 'Not declared in INR (Canadian import)',
      unitSalePrice: null,
      manufactureDate: '08/2023',
      expiryDate: 'Not stated in Indian format',
      batchNumber: 'B8/MA 2023 AL3B · 21650640 AA',
      barcodeNumber: '0 59803 3 1',
      licenseNo: '43429701',
      fssaiLicNo: null,
      manufacturerAddress: 'T.M. Owner: Société Des Produits Nestlé S.A., Vevey, Switzerland. Licensed: Nestlé Canada Inc., North York, ON M2N 6S8',
      countryOfOrigin: null,
      extractedText: 'Nestlé® KitKat® | 45g WAFER BAR / GAUFRETTE | INGREDIENTS: Milk Chocolate, Wheat Flour, Sugar, Modified Palm Oil, Cocoa | Calories 230 per bar | T.M. OWNER: Société Des Produits Nestlé S.A., Vevey, Switzerland | LICENSEE: NESTLÉ CANADA INC., NORTH YORK, ON M2N 6S8 | www.madewithnestle.ca',
      extractedData: {
        commodity_name: 'KitKat Wafer Bar / Gaufrette',
        generic_name: 'Wafer Bar / Gaufrette',
        product_name: 'KitKat Wafer Bar / Gaufrette',
        net_quantity: '45g',
        net_weight: '45g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Nestlé Canada Inc., North York, ON M2N 6S8, Canada',
        manufacturer_name: 'Nestlé Canada Inc.',
        manufacturer_address: 'North York, ON M2N 6S8, Canada',
        manufacturer_packer: 'Nestlé Canada Inc., North York',
        manufacturer_name_address: 'Nestlé Canada Inc., North York, ON M2N 6S8, Canada',
        mfg_date: '08/2023',
        manufacturing_date: '08/2023',
        mfg_month_year: '08/2023',
        packing_date: '08/2023',
        consumer_care: '1-800-387-4636 | www.madewithnestle.ca',
        consumer_care_contact: '1-800-387-4636 | www.madewithnestle.ca',
        customer_care: '1-800-387-4636',
        helpline: '1-800-387-4636',
        best_before: null,
        expiry_date: null,
        batch_no: 'B8/MA 2023 AL3B',
        lot_no: 'B8/MA 2023 AL3B',
        batch_number: 'B8/MA 2023 AL3B',
        country_of_origin: null,
        fssai_no: null,
        license_no: '43429701'
      },
      originalExtractedData: {
        commodity_name: 'KitKat Wafer Bar / Gaufrette',
        generic_name: 'Wafer Bar / Gaufrette',
        product_name: 'KitKat Wafer Bar / Gaufrette',
        net_quantity: '45g',
        net_weight: '45g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Nestlé Canada Inc., North York, ON M2N 6S8, Canada',
        manufacturer_name: 'Nestlé Canada Inc.',
        manufacturer_address: 'North York, ON M2N 6S8, Canada',
        manufacturer_packer: 'Nestlé Canada Inc., North York',
        manufacturer_name_address: 'Nestlé Canada Inc., North York, ON M2N 6S8, Canada',
        mfg_date: '08/2023',
        manufacturing_date: '08/2023',
        mfg_month_year: '08/2023',
        packing_date: '08/2023',
        consumer_care: '1-800-387-4636 | www.madewithnestle.ca',
        consumer_care_contact: '1-800-387-4636 | www.madewithnestle.ca',
        customer_care: '1-800-387-4636',
        helpline: '1-800-387-4636',
        best_before: null,
        expiry_date: null,
        batch_no: 'B8/MA 2023 AL3B',
        lot_no: 'B8/MA 2023 AL3B',
        batch_number: 'B8/MA 2023 AL3B',
        country_of_origin: null,
        fssai_no: null,
        license_no: '43429701'
      },
      overallStatus: 'NON_COMPLIANT',
      status: 'NON_COMPLIANT',
      isCompliant: false,
      violations: [
        'FSSAI Licence Number absent on retail food package (Section 26(2)(ii)(e), FSS Act 2006 [Demo])',
        'Maximum Retail Price (MRP) in INR absent (Rule 6(1)(f), Legal Metrology PC Rules 2011 [Demo])',
        'Country of Origin declaration absent on label (Rule 6(1)(d), PC Rules 2011 [Demo])',
        'Imported packaged commodity marketed without mandatory Indian compliance oversticker [Demo]'
      ],
      complianceViolations: [
        'FSSAI Licence Number absent on retail food package (Section 26(2)(ii)(e), FSS Act 2006 [Demo])',
        'Maximum Retail Price (MRP) in INR absent (Rule 6(1)(f), Legal Metrology PC Rules 2011 [Demo])',
        'Country of Origin declaration absent on label (Rule 6(1)(d), PC Rules 2011 [Demo])',
        'Imported packaged commodity marketed without mandatory Indian compliance oversticker [Demo]'
      ],
      inspectorNotes: 'Imported Canadian packaging. Lacks mandatory Indian Legal Metrology overstickering for INR MRP, FSSAI, and Importer details. [Demo Record]',
      remarks: 'Imported Canadian packaging. Lacks mandatory Indian Legal Metrology overstickering for INR MRP, FSSAI, and Importer details. [Demo Record]',
      reviewComments: 'Form-V Show Cause Notice issued for unauthorized distribution of imported pre-packaged food without mandatory Indian declarations. [Demo Record]',
      officerComments: 'Form-V Show Cause Notice issued for unauthorized distribution of imported pre-packaged food without mandatory Indian declarations. [Demo Record]',
      officerRemarks: 'Form-V Show Cause Notice issued for unauthorized distribution of imported pre-packaged food without mandatory Indian declarations. [Demo Record]',
      zone: 'East',
      state: 'West Bengal',
      location: 'Park Street Import Mart, Kolkata',
      priority: 'Urgent',
      commodityCategory: 'Food / Imported Confectionery',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 97,
      inspectorId: 'demo_insp_05',
      inspectorName: 'Shri Debashish Roy',
      inspector: 'Shri Debashish Roy',
      inspectorBadgeNumber: 'LMI-EZ-2026-905',
      inspectorDesignation: 'Field Inspector (East Zone)',
      inspectorOffice: 'Office of ACLM, Central Kolkata Division, WB',
      officerAssigned: 'demo_officer_ez',
      officerName: 'Smt. Ananya Das',
      officerBadgeNumber: 'LMO-EZ-2026-033',
      officerDesignation: 'Enforcement Officer (East Zone)',
      officerOffice: 'Regional Directorate of Legal Metrology, Kolkata',
      createdAt: '2026-09-29T07:45:00.000Z',
      updatedAt: '2026-09-29T12:00:00.000Z',
      date: '2026-09-29',
      time: '01:15:00 PM',
      formattedDateTime: '29 Sep 2026, 01:15 PM',
      primaryImage: DEMO_IMG_BASE + 'img-4.jpg',
      image: DEMO_IMG_BASE + 'img-4.jpg',
      imageFront: DEMO_IMG_BASE + 'img-4.jpg',
      imageBack: null,
      images: [DEMO_IMG_BASE + 'img-4.jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-4.jpg' },
      auditTrail: [
        { id: 'AUD-demo005a', timestamp: '2026-09-29T07:45:00.000Z', formattedTime: '29 Sep 2026, 01:15:00 PM', action: 'CASE_INITIALIZED', actor: 'Shri Debashish Roy', role: 'Field Inspector', notes: 'Inspection docket initiated for KitKat 45g (Canadian import). [Demo]' },
        { id: 'AUD-demo005b', timestamp: '2026-09-29T12:00:00.000Z', formattedTime: '29 Sep 2026, 05:30:00 PM', action: 'NOTICE_ISSUED', actor: 'Smt. Ananya Das', role: 'Enforcement Officer', notes: 'Form-V Show Cause Notice issued: Import without FSSAI and INR MRP. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'NON_COMPLIANT' }
      ],
      notices: [
        { id: 'DEMO-NOTICE-EZ-2026-005', noticeRef: 'LM/NOTICE/DEMO-LM-EZ-20260929-00005', issuedAt: '2026-09-29T12:30:00.000Z', noticeType: 'SHOW_CAUSE', issuedBy: 'Smt. Ananya Das', content: 'Show Cause Notice issued under Section 36(1) for distribution of imported commodity without Indian statutory labeling. [Demo Notice]' }
      ],
      noticeRef: 'LM/NOTICE/DEMO-LM-EZ-20260929-00005',
      noticeIssuedAt: '2026-09-29T12:30:00.000Z',
      docketHash: 'e5b83c4a2f6b179504cd38569a0e32675482190a7bc65234d98751eafb260005',
      previousHash: 'd4a72b3f1e5a068493bc27458efd21564371089f6ab54123c87640d9fa150004',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T12:00:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/SZ/20260929/00006-D3M0',
      sequenceNumber: 906,
      evidenceId: 'EVD-DEMO-LM-SZ-20260929-00006-D3M0',
      commodity: 'Food — Banana Chips (Snack)',
      brand: 'Oneeio™',
      product: 'Oneeio Jaggery Coated Banana Chips (200g)',
      productName: 'Oneeio Jaggery Coated Banana Chips (200g)',
      netQuantity: '200g',
      mrp: null,
      mrpText: 'Not visible on front label',
      unitSalePrice: null,
      manufactureDate: null,
      expiryDate: '2 months from date of packing',
      batchNumber: null,
      barcodeNumber: 'Not visible',
      licenseNo: 'N/A',
      fssaiLicNo: '21326224000332',
      manufacturerAddress: 'ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala, India',
      countryOfOrigin: 'Made in India',
      extractedText: 'Oneeio™ NATURAL GOODNESS, EVERY BITE! | PROUDLY KERALA PRODUCT | JAGGERY COATED BANANA CHIPS | Net Weight: 200g | FSSAI Lic. No.: 21326224000332 | ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala | Best before: 2 months from date of packing | Packing Date: _________ [BLANK] | Batch No.: _________ [BLANK] | Customer Care: oneeiofoods@gmail.com',
      extractedData: {
        commodity_name: 'Jaggery Coated Banana Chips',
        generic_name: 'Banana Chips (Snack)',
        product_name: 'Oneeio Jaggery Coated Banana Chips',
        net_quantity: '200g',
        net_weight: '200g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala',
        manufacturer_name: 'ONEEIO™',
        manufacturer_address: '2/201, ARIPRA, Malappuram – 679321, Kerala, India',
        manufacturer_packer: 'ONEEIO™, Malappuram, Kerala',
        manufacturer_name_address: 'ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala, India',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Customer Care: ONEEIO™, Aripra, Malappuram 679321 | oneeiofoods@gmail.com',
        consumer_care_contact: 'Customer Care: ONEEIO™, Aripra, Malappuram 679321 | oneeiofoods@gmail.com',
        customer_care: 'oneeiofoods@gmail.com',
        helpline: 'oneeiofoods@gmail.com',
        best_before: '2 months from date of packing',
        expiry_date: '2 months from date of packing',
        batch_no: null,
        lot_no: null,
        batch_number: null,
        country_of_origin: 'Made in India',
        fssai_no: '21326224000332',
        license_no: 'N/A'
      },
      originalExtractedData: {
        commodity_name: 'Jaggery Coated Banana Chips',
        generic_name: 'Banana Chips (Snack)',
        product_name: 'Oneeio Jaggery Coated Banana Chips',
        net_quantity: '200g',
        net_weight: '200g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala',
        manufacturer_name: 'ONEEIO™',
        manufacturer_address: '2/201, ARIPRA, Malappuram – 679321, Kerala, India',
        manufacturer_packer: 'ONEEIO™, Malappuram, Kerala',
        manufacturer_name_address: 'ONEEIO™, 2/201, ARIPRA, Malappuram – 679321, Kerala, India',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Customer Care: ONEEIO™, Aripra, Malappuram 679321 | oneeiofoods@gmail.com',
        consumer_care_contact: 'Customer Care: ONEEIO™, Aripra, Malappuram 679321 | oneeiofoods@gmail.com',
        customer_care: 'oneeiofoods@gmail.com',
        helpline: 'oneeiofoods@gmail.com',
        best_before: '2 months from date of packing',
        expiry_date: '2 months from date of packing',
        batch_no: null,
        lot_no: null,
        batch_number: null,
        country_of_origin: 'Made in India',
        fssai_no: '21326224000332',
        license_no: 'N/A'
      },
      overallStatus: 'NON_COMPLIANT',
      status: 'NON_COMPLIANT',
      isCompliant: false,
      violations: [
        'Packing Date field left blank on package label (Rule 6(1)(e), PC Rules 2011 [Demo])',
        'Batch / Lot number field left blank (Rule 6(1)(l), PC Rules 2011 [Demo])',
        'Best Before period uncomputable without declared packing date [Demo]'
      ],
      complianceViolations: [
        'Packing Date field left blank on package label (Rule 6(1)(e), PC Rules 2011 [Demo])',
        'Batch / Lot number field left blank (Rule 6(1)(l), PC Rules 2011 [Demo])',
        'Best Before period uncomputable without declared packing date [Demo]'
      ],
      inspectorNotes: 'Packaging contains pre-printed template blanks for Packing Date and Batch Number which were left unstamped upon sale. [Demo Record]',
      remarks: 'Packaging contains pre-printed template blanks for Packing Date and Batch Number which were left unstamped upon sale. [Demo Record]',
      reviewComments: 'Form-V Show Cause Notice issued for missing Packing Date and Batch Number declarations in contravention of Rule 6(1). [Demo Record]',
      officerComments: 'Form-V Show Cause Notice issued for missing Packing Date and Batch Number declarations in contravention of Rule 6(1). [Demo Record]',
      officerRemarks: 'Form-V Show Cause Notice issued for missing Packing Date and Batch Number declarations in contravention of Rule 6(1). [Demo Record]',
      zone: 'South',
      state: 'Kerala',
      location: 'Aripra Retail Market, Malappuram',
      priority: 'Urgent',
      commodityCategory: 'Food / Snacks & Chips',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 98,
      inspectorId: 'demo_insp_06',
      inspectorName: 'Kumari Meena Krishnan',
      inspector: 'Kumari Meena Krishnan',
      inspectorBadgeNumber: 'LMI-SZ-2026-906',
      inspectorDesignation: 'Field Inspector (South Zone)',
      inspectorOffice: 'Office of ACLM, Malappuram Division, Kerala',
      officerAssigned: 'demo_officer_sz',
      officerName: 'Shri Karthik Nair',
      officerBadgeNumber: 'LMO-SZ-2026-062',
      officerDesignation: 'Senior Enforcement Officer (South Zone)',
      officerOffice: 'Regional Directorate of Legal Metrology, Chennai',
      createdAt: '2026-09-29T08:00:00.000Z',
      updatedAt: '2026-09-29T13:00:00.000Z',
      date: '2026-09-29',
      time: '01:30:00 PM',
      formattedDateTime: '29 Sep 2026, 01:30 PM',
      primaryImage: DEMO_IMG_BASE + 'img-5.webp',
      image: DEMO_IMG_BASE + 'img-5.webp',
      imageFront: DEMO_IMG_BASE + 'img-5.webp',
      imageBack: null,
      images: [DEMO_IMG_BASE + 'img-5.webp'],
      panelImages: { front: DEMO_IMG_BASE + 'img-5.webp' },
      auditTrail: [
        { id: 'AUD-demo006a', timestamp: '2026-09-29T08:00:00.000Z', formattedTime: '29 Sep 2026, 01:30:00 PM', action: 'CASE_INITIALIZED', actor: 'Kumari Meena Krishnan', role: 'Field Inspector', notes: 'Inspection docket initiated for Oneeio Banana Chips. [Demo]' },
        { id: 'AUD-demo006b', timestamp: '2026-09-29T13:00:00.000Z', formattedTime: '29 Sep 2026, 06:30:00 PM', action: 'NOTICE_ISSUED', actor: 'Shri Karthik Nair', role: 'Enforcement Officer', notes: 'Form-V Show Cause Notice issued: Blank Packing Date and Batch No. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'NON_COMPLIANT' }
      ],
      notices: [
        { id: 'DEMO-NOTICE-SZ-2026-006', noticeRef: 'LM/NOTICE/DEMO-LM-SZ-20260929-00006', issuedAt: '2026-09-29T13:30:00.000Z', noticeType: 'SHOW_CAUSE', issuedBy: 'Shri Karthik Nair', content: 'Show Cause Notice issued under Section 36(1) for blank Packing Date and Batch Number declarations. [Demo Notice]' }
      ],
      noticeRef: 'LM/NOTICE/DEMO-LM-SZ-20260929-00006',
      noticeIssuedAt: '2026-09-29T13:30:00.000Z',
      docketHash: 'f6c94d5b3a7c280615de49670b1f43786593201b8cd76345ea9862fba3370006',
      previousHash: 'e5b83c4a2f6b179504cd38569a0e32675482190a7bc65234d98751eafb260005',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T13:00:00.000Z',
      isDemo: true
    },
    {
      id: 'DEMO-LM/NZ/20260929/00007-D3M0',
      sequenceNumber: 907,
      evidenceId: 'EVD-DEMO-LM-NZ-20260929-00007-D3M0',
      commodity: 'Food — Instant Noodles with Seasoning',
      brand: 'Nestlé India Limited',
      product: 'Maggi 2-Minute Noodles — Masala (70g)',
      productName: 'Maggi 2-Minute Noodles — Masala (70g)',
      netQuantity: '70g',
      mrp: null,
      mrpText: 'On side panel (not captured in image)',
      unitSalePrice: null,
      manufactureDate: 'On side panel',
      expiryDate: 'On side panel',
      batchNumber: 'On side panel',
      barcodeNumber: '8 901058 324018',
      licenseNo: 'Jhaveri Flexo India Ltd. PCC/DDD/JFIL/PW',
      fssaiLicNo: '10012025000202',
      manufacturerAddress: 'Nestlé India Limited, M-5A, Connaught Circus, New Delhi – 110 001, India',
      countryOfOrigin: 'Product of India',
      extractedText: 'Maggi® 2-Minute Noodles | Masala* | Instant Noodles with Seasoning* | Your Favourite Masala Taste | with Goodness of IRON~ | NET QUANTITY: 70g | NESTLE INDIA LIMITED, M-5A, CONNAUGHT CIRCUS, NEW DELHI – 110 001 | PRODUCT OF INDIA | FSSAI Lic. No. 10012025000202 | Calories 310 per 70g | Sodium 890mg (37%) | Helpline: 1800 103 1947',
      extractedData: {
        commodity_name: 'Maggi 2-Minute Noodles Masala',
        generic_name: 'Instant Noodles with Seasoning',
        product_name: 'Maggi 2-Minute Noodles Masala',
        net_quantity: '70g',
        net_weight: '70g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Nestlé India Limited, M-5A, Connaught Circus, New Delhi – 110 001',
        manufacturer_name: 'Nestlé India Limited',
        manufacturer_address: 'M-5A, Connaught Circus, New Delhi – 110 001, India',
        manufacturer_packer: 'Nestlé India Limited, New Delhi',
        manufacturer_name_address: 'Nestlé India Limited, M-5A, Connaught Circus, New Delhi – 110 001, India',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        consumer_care_contact: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        customer_care: '1800 103 1947',
        helpline: '1800 103 1947',
        best_before: 'On side panel',
        expiry_date: 'On side panel',
        batch_no: 'On side panel',
        lot_no: 'On side panel',
        batch_number: 'On side panel',
        country_of_origin: 'Product of India',
        fssai_no: '10012025000202',
        license_no: 'Packaging Lic: PCC/DDD/JFIL/PW'
      },
      originalExtractedData: {
        commodity_name: 'Maggi 2-Minute Noodles Masala',
        generic_name: 'Instant Noodles with Seasoning',
        product_name: 'Maggi 2-Minute Noodles Masala',
        net_quantity: '70g',
        net_weight: '70g',
        mrp: null,
        mrp_tax_inclusive: null,
        unit_sale_price: null,
        usp: null,
        manufacturer: 'Nestlé India Limited, M-5A, Connaught Circus, New Delhi – 110 001',
        manufacturer_name: 'Nestlé India Limited',
        manufacturer_address: 'M-5A, Connaught Circus, New Delhi – 110 001, India',
        manufacturer_packer: 'Nestlé India Limited, New Delhi',
        manufacturer_name_address: 'Nestlé India Limited, M-5A, Connaught Circus, New Delhi – 110 001, India',
        mfg_date: null,
        manufacturing_date: null,
        mfg_month_year: null,
        packing_date: null,
        consumer_care: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        consumer_care_contact: 'Helpline: 1800 103 1947 | wecare@in.nestle.com',
        customer_care: '1800 103 1947',
        helpline: '1800 103 1947',
        best_before: 'On side panel',
        expiry_date: 'On side panel',
        batch_no: 'On side panel',
        lot_no: 'On side panel',
        batch_number: 'On side panel',
        country_of_origin: 'Product of India',
        fssai_no: '10012025000202',
        license_no: 'Packaging Lic: PCC/DDD/JFIL/PW'
      },
      overallStatus: 'UNDER_REVIEW',
      status: 'UNDER_REVIEW',
      isCompliant: false,
      violations: [
        'Health claim "With Goodness of IRON~" requires FSSAI substantiation per Claims Regulations 2022 [Demo]',
        'Side panel statutory declarations (MRP, MFD, Expiry) not captured in primary specimen evidence [Demo]'
      ],
      complianceViolations: [
        'Health claim "With Goodness of IRON~" requires FSSAI substantiation per Claims Regulations 2022 [Demo]',
        'Side panel statutory declarations (MRP, MFD, Expiry) not captured in primary specimen evidence [Demo]'
      ],
      inspectorNotes: 'Front and back panels captured. Side panel containing MRP and date stamp was not captured in this scan. Under review. [Demo Record]',
      remarks: 'Front and back panels captured. Side panel containing MRP and date stamp was not captured in this scan. Under review. [Demo Record]',
      reviewComments: 'Under review pending secondary side-panel capture for verification of MRP and batch date. [Demo Record]',
      officerComments: 'Under review pending secondary side-panel capture for verification of MRP and batch date. [Demo Record]',
      officerRemarks: 'Under review pending secondary side-panel capture for verification of MRP and batch date. [Demo Record]',
      zone: 'North',
      state: 'Delhi',
      location: 'Connaught Place Departmental Store, New Delhi',
      priority: 'Standard',
      commodityCategory: 'Food / Instant Noodles & Cereals',
      mode: 'Multi-Panel AI Optical Verification',
      scanMode: 'Multi-Panel AI Optical Verification',
      confidence: 96,
      inspectorId: 'demo_insp_07',
      inspectorName: 'Shri Rahul Gupta',
      inspector: 'Shri Rahul Gupta',
      inspectorBadgeNumber: 'LMI-NZ-2026-907',
      inspectorDesignation: 'Field Inspector (North Zone)',
      inspectorOffice: 'Office of ACLM, Central Delhi Division, New Delhi',
      officerAssigned: 'demo_officer_nz',
      officerName: 'Shri Arjun Singh',
      officerBadgeNumber: 'LMO-NZ-2026-045',
      officerDesignation: 'Senior Enforcement Officer (North Zone)',
      officerOffice: 'Regional Directorate of Legal Metrology, New Delhi',
      createdAt: '2026-09-29T08:30:00.000Z',
      updatedAt: '2026-09-29T14:00:00.000Z',
      date: '2026-09-29',
      time: '02:00:00 PM',
      formattedDateTime: '29 Sep 2026, 02:00 PM',
      primaryImage: DEMO_IMG_BASE + 'img-7 (2).jpg',
      image: DEMO_IMG_BASE + 'img-7 (2).jpg',
      imageFront: DEMO_IMG_BASE + 'img-7 (2).jpg',
      imageBack: DEMO_IMG_BASE + 'img-7 (1).jpg',
      images: [DEMO_IMG_BASE + 'img-7 (2).jpg', DEMO_IMG_BASE + 'img-7 (1).jpg'],
      panelImages: { front: DEMO_IMG_BASE + 'img-7 (2).jpg', back: DEMO_IMG_BASE + 'img-7 (1).jpg' },
      auditTrail: [
        { id: 'AUD-demo007a', timestamp: '2026-09-29T08:30:00.000Z', formattedTime: '29 Sep 2026, 02:00:00 PM', action: 'CASE_INITIALIZED', actor: 'Shri Rahul Gupta', role: 'Field Inspector', notes: 'Inspection docket initiated for Maggi 2-Minute Noodles. [Demo]' },
        { id: 'AUD-demo007b', timestamp: '2026-09-29T14:00:00.000Z', formattedTime: '29 Sep 2026, 07:30:00 PM', action: 'REVIEW', actor: 'Shri Arjun Singh', role: 'Enforcement Officer', notes: 'Moved to UNDER_REVIEW: Side panel and health claim verification required. [Demo]', statusFrom: 'SUBMITTED', statusTo: 'UNDER_REVIEW' }
      ],
      notices: [],
      docketHash: '07da5e6c4b8d391726ef50781c2a54897604312c9de87456fb0973acb4480007',
      previousHash: 'f6c94d5b3a7c280615de49670b1f43786593201b8cd76345ea9862fba3370006',
      hashAlgorithm: 'SHA-256',
      hashSealedAt: '2026-09-29T14:00:00.000Z',
      isDemo: true
    }
  ];

  /* ── Core Demo State Helpers ────────────────────────────────────────────── */
  function isDemoModeActive() {
    try {
      return localStorage.getItem(DEMO_FLAG_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function getDemoInspections() {
    return DEMO_CASES.slice();
  }

  function activateDemoMode() {
    try {
      localStorage.setItem(DEMO_FLAG_KEY, 'true');
    } catch (e) {}
    closeDemoActivationModal();
    window.location.reload();
  }

  function deactivateDemoMode() {
    try {
      localStorage.removeItem(DEMO_FLAG_KEY);
    } catch (e) {}
    window.location.reload();
  }

  /* ── Notice PDF helper fallback for UI buttons ─────────────────────────── */
  if (typeof window.downloadNoticePdf !== 'function') {
    window.downloadNoticePdf = function (id) {
      if (typeof window.generateStatutoryNoticePDF === 'function') {
        window.generateStatutoryNoticePDF(id);
      } else if (typeof window.downloadInspectionPDF === 'function') {
        window.downloadInspectionPDF(id);
      } else {
        window.print();
      }
    };
  }

  /* ── Mount Demo Button in Top Navigation (Preserves all existing elements) ── */
  function mountDemoButton() {
    var existingBtn = document.getElementById('metroDemoTriggerBtn');
    if (existingBtn) existingBtn.remove();

    var active = isDemoModeActive();
    if (active) {
      document.body.classList.add('demo-mode-active');
    } else {
      document.body.classList.remove('demo-mode-active');
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'metroDemoTriggerBtn';
    btn.className = 'metro-demo-nav-btn' + (active ? ' is-active' : '');

    if (active) {
      btn.title = 'Demo Mode is active. Click to deactivate and restore live state.';
      btn.setAttribute('aria-label', 'Deactivate Demo Mode');
      btn.onclick = deactivateDemoMode;
      btn.innerHTML = '<span class="metro-demo-pulse-dot"></span><span>Deactivate Demo</span>';
    } else {
      btn.title = 'Experience METRO-CHECK with 7 verified demo cases';
      btn.setAttribute('aria-label', 'Open Demo Mode');
      btn.onclick = openDemoActivationModal;
      btn.innerHTML = '<span class="metro-demo-sparkle">⚡</span><span>Demo</span>';
    }

    // Identify the best top navigation insertion target per page
    var mounted = false;

    // 1. Inspector page: next to Optical Scanner button or notification bell
    var inspectorActions = document.querySelector('#headerQuickOcrBtn');
    if (inspectorActions && inspectorActions.parentElement) {
      inspectorActions.parentElement.insertBefore(btn, inspectorActions);
      mounted = true;
    }

    // 2. Officer page: next to Judicial Quorum badge or notification bell
    if (!mounted) {
      var officerBell = document.getElementById('officerNotificationBellBtn');
      if (officerBell && officerBell.parentElement && officerBell.parentElement.parentElement) {
        var actionGroup = officerBell.parentElement.parentElement;
        actionGroup.insertBefore(btn, officerBell.parentElement);
        mounted = true;
      }
    }

    // 3. Admin page: next to notification bell
    if (!mounted) {
      var adminBell = document.getElementById('adminNotificationBellBtn');
      if (adminBell && adminBell.parentElement && adminBell.parentElement.parentElement) {
        var adminActionGroup = adminBell.parentElement.parentElement;
        adminActionGroup.insertBefore(btn, adminBell.parentElement);
        mounted = true;
      }
    }

    // 4. Report page: inside top action bar
    if (!mounted) {
      var reportTopBar = document.getElementById('reportTopActionBar');
      if (reportTopBar) {
        var innerFlex = reportTopBar.querySelector('.flex') || reportTopBar;
        innerFlex.appendChild(btn);
        mounted = true;
      }
    }

    // 5. Index page or Masthead Dock fallback: insert into masthead pill dock or utility area
    if (!mounted) {
      var mastheadDock = document.querySelector('.masthead-pill-dock');
      if (mastheadDock && mastheadDock.parentElement) {
        mastheadDock.parentElement.insertBefore(btn, mastheadDock.nextSibling);
        mounted = true;
      }
    }

    // 6. Absolute fail-safe: clean floating pill
    if (!mounted) {
      btn.classList.add('metro-demo-floating');
      document.body.appendChild(btn);
    }
  }

  /* ── Activation Modal with exact 'Activate Demo' and 'Exit' options ─────── */
  function openDemoActivationModal() {
    var modal = document.getElementById('demoActivationModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'demoActivationModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'demoModalTitle');
      modal.innerHTML =
        '<div class="demo-modal-card">' +
          '<div class="demo-modal-header">' +
            '<div class="demo-modal-icon-badge">⚡</div>' +
            '<div>' +
              '<h3 class="demo-modal-title" id="demoModalTitle">METRO-CHECK Demo Mode</h3>' +
              '<p class="demo-modal-subtitle">Interactive compliance inspection showcase</p>' +
            '</div>' +
          '</div>' +
          '<div class="demo-modal-desc">' +
            'Experience the complete Legal Metrology platform with 7 verified real product inspection cases based on actual packaging labels. Explore OCR scanning, official notice generation, review dockets, and ledger analytics with simulated data. Zero impact on production.' +
          '</div>' +
          '<div class="demo-modal-features">' +
            '<div class="demo-modal-feature-item"><span class="feat-dot"></span><strong>7 Verified Products:</strong> Navneet Note Book, Maaza 1.75L, DOMS Pens, Milkybar, KitKat, Oneeio Chips, Maggi Noodles</div>' +
            '<div class="demo-modal-feature-item"><span class="feat-dot"></span><strong>Multi-Status Coverage:</strong> Compliant, Non-Compliant, and Under Review</div>' +
            '<div class="demo-modal-feature-item"><span class="feat-dot"></span><strong>Platform-Wide Sync:</strong> Dashboard, My Inspections, Docket, Ledger & Notices</div>' +
            '<div class="demo-modal-feature-item"><span class="feat-dot"></span><strong>Safe Sandboxing:</strong> Real storage and official records remain untouched</div>' +
          '</div>' +
          '<div class="demo-modal-actions">' +
            '<button type="button" class="demo-btn-activate" onclick="window.activateDemoMode()">' +
              '<span>✓</span> <span>Activate Demo</span>' +
            '</button>' +
            '<button type="button" class="demo-btn-exit" onclick="window.closeDemoActivationModal()">' +
              '<span>✕</span> <span>Exit</span>' +
            '</button>' +
          '</div>' +
        '</div>';
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDemoActivationModal();
      });
      document.body.appendChild(modal);
    } else {
      modal.classList.remove('hidden');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDemoActivationModal() {
    var modal = document.getElementById('demoActivationModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ── Demo OCR Specimen Picker Modal ────────────────────────────────────── */
  function openOcrPickerModal() {
    var modal = document.getElementById('demoOcrPickerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'demoOcrPickerModal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'demoPickerTitle');
      modal.innerHTML =
        '<div class="demo-picker-card">' +
          '<div class="demo-picker-header">' +
            '<div class="demo-picker-title-group">' +
              '<span class="demo-picker-icon">📷</span>' +
              '<div>' +
                '<h3 class="demo-picker-title" id="demoPickerTitle">AI OCR Specimen Selector</h3>' +
                '<p class="demo-picker-sub">Choose a verified product specimen to load into the AI camera</p>' +
              '</div>' +
            '</div>' +
            '<button type="button" class="demo-picker-close-btn" onclick="window.closeOcrPickerModal()" aria-label="Close">&#10005;</button>' +
          '</div>' +
          '<div class="demo-picker-grid" id="demoCaseThumbnailGrid"></div>' +
          '<div class="demo-picker-footer">' +
            '<span class="demo-picker-tip">💡 Click any specimen to load it directly into the inspection scanner</span>' +
            '<button type="button" class="demo-picker-cancel-btn" onclick="window.closeOcrPickerModal()">Close</button>' +
          '</div>' +
        '</div>';

      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeOcrPickerModal();
      });
      document.body.appendChild(modal);
    } else {
      modal.classList.remove('hidden');
    }
    populateDemoCaseGrid();
    document.body.style.overflow = 'hidden';
  }

  function closeOcrPickerModal() {
    var modal = document.getElementById('demoOcrPickerModal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function getStatusClass(status) {
    if (status === 'COMPLIANT') return 'status-compliant';
    if (status === 'NON_COMPLIANT') return 'status-non-compliant';
    if (status === 'UNDER_REVIEW') return 'status-under-review';
    return 'status-submitted';
  }

  function getStatusLabel(status) {
    if (status === 'COMPLIANT') return 'Compliant';
    if (status === 'NON_COMPLIANT') return 'Non-Compliant';
    if (status === 'UNDER_REVIEW') return 'Under Review';
    return status;
  }

  function populateDemoCaseGrid() {
    var grid = document.getElementById('demoCaseThumbnailGrid');
    if (!grid) return;
    grid.innerHTML = '';

    DEMO_CASES.forEach(function (c, idx) {
      var thumb = document.createElement('div');
      thumb.className = 'demo-case-thumb';
      thumb.tabIndex = 0;
      thumb.setAttribute('role', 'button');
      thumb.setAttribute('aria-label', 'Load ' + c.productName);

      thumb.innerHTML =
        '<div class="demo-case-thumb-img-wrapper">' +
          '<img src="' + c.primaryImage + '" alt="' + c.productName + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2212%22 fill=%22%2394a3b8%22>Specimen</text></svg>\'"/>' +
          '<span class="demo-case-status ' + getStatusClass(c.status) + '">' + getStatusLabel(c.status) + '</span>' +
          '<div class="demo-case-loading-overlay hidden" id="demoCaseLoader-' + idx + '"><div class="demo-spinner"></div></div>' +
        '</div>' +
        '<div class="demo-case-info">' +
          '<div class="demo-case-name" title="' + c.productName + '">' + c.productName + '</div>' +
          '<div class="demo-case-brand">' + c.brand + '</div>' +
          '<div class="demo-case-badge-row">' +
            '<span class="demo-case-qty">' + (c.netQuantity || 'N/A') + '</span>' +
            '<span class="demo-case-zone">' + c.zone + ' Zone</span>' +
          '</div>' +
        '</div>';

      thumb.addEventListener('click', function () { loadDemoCaseIntoScanner(idx); });
      thumb.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadDemoCaseIntoScanner(idx);
        }
      });
      grid.appendChild(thumb);
    });
  }

  function loadDemoCaseIntoScanner(caseIndex) {
    var demoCase = DEMO_CASES[caseIndex];
    if (!demoCase) return;

    var loader = document.getElementById('demoCaseLoader-' + caseIndex);
    if (loader) loader.classList.remove('hidden');

    fetch(demoCase.primaryImage)
      .then(function (res) {
        if (!res.ok) throw new Error('Image fetch failed: ' + res.status);
        return res.blob();
      })
      .then(function (blob) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var dataUrl = e.target.result;
          if (loader) loader.classList.add('hidden');
          closeOcrPickerModal();

          // Switch to OCR tab if on inspector page
          if (typeof switchInspectorTab === 'function') {
            switchInspectorTab('ocr');
          }

          // Inject image into scanner slots after short delay
          setTimeout(function () {
            if (typeof setSpecimenImage === 'function') {
              setSpecimenImage(dataUrl);
            }
            if (typeof setSlotImage === 'function') {
              setSlotImage('front', dataUrl);
              if (typeof updateMultiPanelState === 'function') updateMultiPanelState();
            }

            // Load back panel if second image available
            if (demoCase.images && demoCase.images.length > 1) {
              fetch(demoCase.images[1])
                .then(function (r) { return r.blob(); })
                .then(function (b2) {
                  var r2 = new FileReader();
                  r2.onload = function (ev) {
                    if (typeof setSlotImage === 'function') {
                      setSlotImage('back', ev.target.result);
                      if (typeof updateMultiPanelState === 'function') updateMultiPanelState();
                    }
                  };
                  r2.readAsDataURL(b2);
                }).catch(function () {});
            }

            if (typeof showToast === 'function') {
              showToast('Demo specimen loaded: ' + demoCase.productName + '. Ready for AI analysis.', 'info');
            }
          }, 300);
        };
        reader.onerror = function () {
          if (loader) loader.classList.add('hidden');
          if (typeof showToast === 'function') showToast('Failed to read demo image.', 'error');
        };
        reader.readAsDataURL(blob);
      })
      .catch(function (err) {
        if (loader) loader.classList.add('hidden');
        if (typeof showToast === 'function') {
          showToast('Could not load demo image. Ensure demo/image/ folder is accessible.', 'error');
        }
        console.warn('[DEMO MODE] Image load error:', err);
      });
  }

  /* ── Storage Intercept & Simulation Sandboxing ─────────────────────────── */
  function patchStorageFunctions() {
    // getInspections
    if (typeof window.getInspections === 'function') {
      var _origGetInspections = window.getInspections;
      window.getInspections = function () {
        if (isDemoModeActive()) return getDemoInspections();
        return _origGetInspections.apply(this, arguments);
      };
    }

    // getInspectionById
    if (typeof window.getInspectionById === 'function') {
      var _origById = window.getInspectionById;
      window.getInspectionById = function (id) {
        if (isDemoModeActive()) {
          var raw = String(id || '').trim();
          var dec = decodeURIComponent(raw);
          var found = DEMO_CASES.find(function (c) {
            var cid = String(c.id).trim();
            return cid === raw || cid === dec || decodeURIComponent(cid) === dec;
          });
          if (found) return found;
        }
        return _origById.apply(this, arguments);
      };
    }

    // saveInspection — sandboxed in-memory updates for demo cases
    if (typeof window.saveInspection === 'function') {
      var _origSave = window.saveInspection;
      window.saveInspection = function (data) {
        if (isDemoModeActive() && data && data.isDemo) {
          var rawId = String(data.id || '').trim();
          var idx = DEMO_CASES.findIndex(function (c) {
            return String(c.id).trim() === rawId;
          });
          if (idx !== -1) {
            DEMO_CASES[idx] = Object.assign({}, DEMO_CASES[idx], data);
          } else {
            DEMO_CASES.unshift(data);
          }
          console.info('[DEMO MODE] In-memory update persisted for demo case: ' + data.id);
          return data;
        }
        return _origSave.apply(this, arguments);
      };
    }

    // filterByZoneAccess — allow demo cases to display across all zones
    if (typeof window.filterByZoneAccess === 'function') {
      var _origFilter = window.filterByZoneAccess;
      window.filterByZoneAccess = function (inspections) {
        if (isDemoModeActive()) return inspections;
        return _origFilter.apply(this, arguments);
      };
    }
  }

  /* ── Demo OCR Picker Banner in OCR View Panel ───────────────────────────── */
  function injectDemoOcrPickerButton() {
    if (!isDemoModeActive()) return;

    var ocrView = document.getElementById('view-ocr');
    if (!ocrView) return;
    if (document.getElementById('demoOcrPickerBtn')) return;

    var ocrHeaderBar = document.getElementById('ocrHeaderStatutoryBar');

    var pickerBanner = document.createElement('div');
    pickerBanner.id = 'demoOcrPickerBtn';
    pickerBanner.className = 'demo-ocr-banner';
    pickerBanner.innerHTML =
      '<div class="demo-ocr-banner-left">' +
        '<span class="demo-ocr-pulse"></span>' +
        '<span>DEMO MODE ACTIVE — Use a pre-verified product specimen, or test with the live camera</span>' +
      '</div>' +
      '<button type="button" class="demo-ocr-launch-btn" onclick="window.openOcrPickerModal()">' +
        '📷 Choose Demo Product' +
      '</button>';

    if (ocrHeaderBar && ocrHeaderBar.parentNode) {
      ocrHeaderBar.parentNode.insertBefore(pickerBanner, ocrHeaderBar);
    } else {
      ocrView.prepend(pickerBanner);
    }
  }

  function watchForOcrTab() {
    if (!isDemoModeActive()) return;
    var ocrView = document.getElementById('view-ocr');
    if (!ocrView) return;

    var observer = new MutationObserver(function () {
      if (!ocrView.classList.contains('hidden')) {
        injectDemoOcrPickerButton();
      }
    });
    observer.observe(ocrView, { attributes: true, attributeFilter: ['class'] });

    if (!ocrView.classList.contains('hidden')) {
      injectDemoOcrPickerButton();
    }
  }

  /* ── Keyboard Shortcuts ─────────────────────────────────────────────────── */
  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      closeDemoActivationModal();
      closeOcrPickerModal();
    }
  }

  /* ── Initialize ─────────────────────────────────────────────────────────── */
  function initDemoMode() {
    patchStorageFunctions();
    mountDemoButton();
    watchForOcrTab();
    document.addEventListener('keydown', handleEscapeKey);

    // Re-mount button on window load to ensure all dynamic elements are available
    window.addEventListener('load', function () {
      mountDemoButton();
    });

    // Public APIs
    window.isDemoModeActive = isDemoModeActive;
    window.getDemoInspections = getDemoInspections;
    window.activateDemoMode = activateDemoMode;
    window.deactivateDemoMode = deactivateDemoMode;
    window.openDemoActivationModal = openDemoActivationModal;
    window.closeDemoActivationModal = closeDemoActivationModal;
    window.openOcrPickerModal = openOcrPickerModal;
    window.closeOcrPickerModal = closeOcrPickerModal;
    window.DEMO_CASES = DEMO_CASES;
  }

  // Run patch immediately upon script evaluation if storage already loaded
  patchStorageFunctions();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemoMode);
  } else {
    initDemoMode();
  }

})();
