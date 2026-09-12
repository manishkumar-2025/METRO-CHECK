/* ==========================================================================
   METRO-CHECK - Isolated Demonstration & Prototype Data Engine (js/demo-data.js)
   Legal Metrology (Packaged Commodities) Rules, 2011 • Government of India
   ========================================================================== */

(function(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DemoData = factory();
  }
})(typeof self !== "undefined" ? self : this, function() {
  "use strict";

  const STORAGE_KEY_INSPECTIONS = "inspections";
  const STORAGE_KEY_ACTIVITIES = "adminActivities";

  /**
   * Official 10 demo inspection records distributed across all 6 Indian Zonal Councils.
   */
  const DEMO_INSPECTIONS = [
    // 1. North Zone - Delhi UT (Non-Compliant Pending Review)
    {
      id: "INS-1024",
      product: "Basmati Rice Premium 5kg",
      productName: "Basmati Rice Premium 5kg",
      zone: "North",
      state: "Delhi UT",
      inspectorId: "inspector",
      inspectorName: "Shri R Sharma",
      status: "NON_COMPLIANT_PENDING",
      isCompliant: false,
      violations: ["Rule 6(1)(n): Missing Consumer Care Contact Details"],
      timestamp: "2025-01-15T09:30:00.000Z",
      date: "2025-01-15",
      priority: "Urgent",
      location: "Warehouse 4, Okhla Industrial Area, Delhi",
      extractedData: {
        commodity_name: "Basmati Rice Premium",
        generic_name: "Basmati Rice Premium",
        net_quantity: "5 kg",
        mrp: "₹450.00",
        mrp_tax_inclusive: "₹450.00",
        manufacturer: "ABC Foods Pvt Ltd, Delhi",
        manufacturer_name_address: "ABC Foods Pvt Ltd, Delhi",
        mfg_date: "01/2025",
        mfg_month_year: "01/2025",
        consumer_care: null,
        consumer_care_contact: null
      }
    },
    // 2. North Zone - Punjab (Compliant)
    {
      id: "INS-1025",
      product: "Organic Wheat Atta 10kg",
      productName: "Organic Wheat Atta 10kg",
      zone: "North",
      state: "Punjab",
      inspectorId: "inspector_pb",
      inspectorName: "S Kaur",
      status: "COMPLIANT_LOGGED",
      isCompliant: true,
      violations: [],
      timestamp: "2025-01-15T11:15:00.000Z",
      date: "2025-01-15",
      priority: "Low",
      location: "Grain Market Mandi, Ludhiana, Punjab",
      reviewComments: "Complete statutory compliance under Rule 6. Standard declarations verified.",
      extractedData: {
        commodity_name: "Organic Wheat Atta",
        generic_name: "Organic Wheat Atta",
        net_quantity: "10 kg",
        mrp: "₹380.00",
        mrp_tax_inclusive: "₹380.00",
        manufacturer: "Punjab Agro Grains Ltd, Ludhiana",
        manufacturer_name_address: "Punjab Agro Grains Ltd, Ludhiana",
        mfg_date: "12/2024",
        mfg_month_year: "12/2024",
        consumer_care: "support@punjabagro.in",
        consumer_care_contact: "support@punjabagro.in"
      }
    },
    // 3. North Zone - Haryana (Notice Issued)
    {
      id: "INS-1026",
      product: "Pure Cow Ghee 500ml",
      productName: "Pure Cow Ghee 500ml",
      zone: "North",
      state: "Haryana",
      inspectorId: "inspector",
      inspectorName: "Shri R Sharma",
      status: "NOTICE_ISSUED",
      isCompliant: false,
      violations: [
        "Rule 6(1)(e): Missing Currency Symbol on Retail Sale Price",
        "Rule 9(1): Substandard Font Size on Net Quantity"
      ],
      timestamp: "2025-01-14T14:20:00.000Z",
      date: "2025-01-14",
      priority: "Urgent",
      location: "Highway Logistics Depot, Karnal, Haryana",
      reviewComments: "Statutory show-cause notice issued under Rule 32 for font height contravention and defective MRP formatting.",
      extractedData: {
        commodity_name: "Pure Cow Ghee",
        generic_name: "Pure Cow Ghee",
        net_quantity: "500 ml",
        mrp: "420",
        mrp_tax_inclusive: "420",
        manufacturer: "Dairy Valley Agro Ltd, Karnal",
        manufacturer_name_address: "Dairy Valley Agro Ltd, Karnal",
        mfg_date: "10/2024",
        mfg_month_year: "10/2024",
        consumer_care: "care@dairyvalley.in",
        consumer_care_contact: "care@dairyvalley.in"
      }
    },
    // 4. South Zone - Kerala (Compliant)
    {
      id: "INS-1027",
      product: "Roasted Coconut Oil 1L",
      productName: "Roasted Coconut Oil 1L",
      zone: "South",
      state: "Kerala",
      inspectorId: "inspector_south",
      inspectorName: "A Menon",
      status: "COMPLIANT_LOGGED",
      isCompliant: true,
      violations: [],
      timestamp: "2025-01-14T10:00:00.000Z",
      date: "2025-01-14",
      priority: "Low",
      location: "Central Supermarket, Kochi, Kerala",
      reviewComments: "All mandatory markings verified as per Schedule 2.",
      extractedData: {
        commodity_name: "Roasted Coconut Oil",
        generic_name: "Roasted Coconut Oil",
        net_quantity: "1 L",
        mrp: "₹240.00",
        mrp_tax_inclusive: "₹240.00",
        manufacturer: "Malabar Edible Oils Ltd, Kozhikode",
        manufacturer_name_address: "Malabar Edible Oils Ltd, Kozhikode",
        mfg_date: "12/2024",
        mfg_month_year: "12/2024",
        consumer_care: "care@malabaroils.com",
        consumer_care_contact: "care@malabaroils.com"
      }
    },
    // 5. South Zone - Karnataka (Non-Compliant Pending)
    {
      id: "INS-1028",
      product: "Filter Coffee Blend 500g",
      productName: "Filter Coffee Blend 500g",
      zone: "South",
      state: "Karnataka",
      inspectorId: "inspector_south",
      inspectorName: "A Menon",
      status: "NON_COMPLIANT_PENDING",
      isCompliant: false,
      violations: ["Rule 6(1)(d): Missing Month and Year of Manufacture"],
      timestamp: "2025-01-13T16:45:00.000Z",
      date: "2025-01-13",
      priority: "Standard",
      location: "Koramangala Commercial Hub, Bengaluru, Karnataka",
      extractedData: {
        commodity_name: "Filter Coffee Blend",
        generic_name: "Filter Coffee Blend",
        net_quantity: "500 g",
        mrp: "₹290.00",
        mrp_tax_inclusive: "₹290.00",
        manufacturer: "Mysore Plantation Beverages, Bengaluru",
        manufacturer_name_address: "Mysore Plantation Beverages, Bengaluru",
        mfg_date: null,
        mfg_month_year: null,
        consumer_care: "coffee@mysorebeverages.in",
        consumer_care_contact: "coffee@mysorebeverages.in"
      }
    },
    // 6. West Zone - Maharashtra (Compliant)
    {
      id: "INS-1029",
      product: "Refined Sunflower Oil 1L",
      productName: "Refined Sunflower Oil 1L",
      zone: "West",
      state: "Maharashtra",
      inspectorId: "inspector",
      inspectorName: "Field Inspector",
      status: "COMPLIANT_LOGGED",
      isCompliant: true,
      violations: [],
      timestamp: "2025-01-13T12:30:00.000Z",
      date: "2025-01-13",
      priority: "Low",
      location: "APMC Wholesale Market, Vashi, Navi Mumbai",
      reviewComments: "Verified compliant with Legal Metrology Packaged Commodities Rules 2011.",
      extractedData: {
        commodity_name: "Refined Sunflower Oil",
        generic_name: "Refined Sunflower Oil",
        net_quantity: "1 L",
        mrp: "₹165.00",
        mrp_tax_inclusive: "₹165.00",
        manufacturer: "Sahyadri Agro Refineries Ltd, Pune",
        manufacturer_name_address: "Sahyadri Agro Refineries Ltd, Pune",
        mfg_date: "01/2025",
        mfg_month_year: "01/2025",
        consumer_care: "care@sahyadriagro.com",
        consumer_care_contact: "care@sahyadriagro.com"
      }
    },
    // 7. West Zone - Gujarat (Non-Compliant Pending)
    {
      id: "INS-1030",
      product: "Double Filtered Groundnut Oil 5L",
      productName: "Double Filtered Groundnut Oil 5L",
      zone: "West",
      state: "Gujarat",
      inspectorId: "inspector",
      inspectorName: "Field Inspector",
      status: "NON_COMPLIANT_PENDING",
      isCompliant: false,
      violations: ["Rule 6(1)(a): Non-standard Packer Address (City and PIN code missing)"],
      timestamp: "2025-01-12T15:10:00.000Z",
      date: "2025-01-12",
      priority: "Urgent",
      location: "Ring Road Wholesale Complex, Surat, Gujarat",
      extractedData: {
        commodity_name: "Double Filtered Groundnut Oil",
        generic_name: "Double Filtered Groundnut Oil",
        net_quantity: "5 L",
        mrp: "₹890.00",
        mrp_tax_inclusive: "₹890.00",
        manufacturer: "Saurashtra Oil Mills",
        manufacturer_name_address: "Saurashtra Oil Mills",
        mfg_date: "12/2024",
        mfg_month_year: "12/2024",
        consumer_care: "support@saurashtraoil.com",
        consumer_care_contact: "support@saurashtraoil.com"
      }
    },
    // 8. East Zone - West Bengal (Compliant)
    {
      id: "INS-1031",
      product: "Mustard Oil Kachi Ghani 1L",
      productName: "Mustard Oil Kachi Ghani 1L",
      zone: "East",
      state: "West Bengal",
      inspectorId: "inspector",
      inspectorName: "Field Inspector",
      status: "COMPLIANT_LOGGED",
      isCompliant: true,
      violations: [],
      timestamp: "2025-01-12T09:40:00.000Z",
      date: "2025-01-12",
      priority: "Low",
      location: "Posta Bazar Wholesale Depot, Kolkata, West Bengal",
      reviewComments: "Prescribed metric declaration and packaging license details validated.",
      extractedData: {
        commodity_name: "Mustard Oil Kachi Ghani",
        generic_name: "Mustard Oil Kachi Ghani",
        net_quantity: "1 L",
        mrp: "₹175.00",
        mrp_tax_inclusive: "₹175.00",
        manufacturer: "Bengal Agrotech Oils Ltd, Howrah",
        manufacturer_name_address: "Bengal Agrotech Oils Ltd, Howrah",
        mfg_date: "01/2025",
        mfg_month_year: "01/2025",
        consumer_care: "contact@bengalagrotech.in",
        consumer_care_contact: "contact@bengalagrotech.in"
      }
    },
    // 9. Central Zone - Uttar Pradesh (Non-Compliant Pending)
    {
      id: "INS-1032",
      product: "Special Dairy Paneer 200g",
      productName: "Special Dairy Paneer 200g",
      zone: "Central",
      state: "Uttar Pradesh",
      inspectorId: "inspector",
      inspectorName: "Field Inspector",
      status: "NON_COMPLIANT_PENDING",
      isCompliant: false,
      violations: ["Rule 6(1)(c): Net quantity missing required metric unit symbol (declared without 'g')"],
      timestamp: "2025-01-11T13:20:00.000Z",
      date: "2025-01-11",
      priority: "Standard",
      location: "Alambagh Mandi, Lucknow, Uttar Pradesh",
      extractedData: {
        commodity_name: "Special Dairy Paneer",
        generic_name: "Special Dairy Paneer",
        net_quantity: "200",
        mrp: "₹95.00",
        mrp_tax_inclusive: "₹95.00",
        manufacturer: "Awadh Dairy Cooperative, Lucknow",
        manufacturer_name_address: "Awadh Dairy Cooperative, Lucknow",
        mfg_date: "01/2025",
        mfg_month_year: "01/2025",
        consumer_care: "helpline@awadhdairy.org",
        consumer_care_contact: "helpline@awadhdairy.org"
      }
    },
    // 10. North East Zone - Assam (Compliant)
    {
      id: "INS-1033",
      product: "Assam Orthodox CTC Tea 500g",
      productName: "Assam Orthodox CTC Tea 500g",
      zone: "North East",
      state: "Assam",
      inspectorId: "inspector",
      inspectorName: "Field Inspector",
      status: "COMPLIANT_LOGGED",
      isCompliant: true,
      violations: [],
      timestamp: "2025-01-11T10:15:00.000Z",
      date: "2025-01-11",
      priority: "Low",
      location: "Paltan Bazar Tea Mart, Guwahati, Assam",
      reviewComments: "Declaration markings meet Schedule 2 standard packing sizes for tea.",
      extractedData: {
        commodity_name: "Assam Orthodox CTC Tea",
        generic_name: "Assam Orthodox CTC Tea",
        net_quantity: "500 g",
        mrp: "₹320.00",
        mrp_tax_inclusive: "₹320.00",
        manufacturer: "Brahmaputra Valley Tea Estates Ltd, Dibrugarh",
        manufacturer_name_address: "Brahmaputra Valley Tea Estates Ltd, Dibrugarh",
        mfg_date: "12/2024",
        mfg_month_year: "12/2024",
        consumer_care: "info@brahmaputratea.com",
        consumer_care_contact: "info@brahmaputratea.com"
      }
    }
  ];

  /**
   * Sample audit log activities for prototype demonstration.
   */
  const DEMO_ACTIVITIES = [
    { time: "2 min ago", user: "Shri R Sharma (Delhi)", action: "New Scan", details: "INS-1024 Basmati Rice scanned & submitted" },
    { time: "18 min ago", user: "Dr S Roy (Officer)", action: "Notice Generated", details: "Show-cause order issued for INS-1026" },
    { time: "45 min ago", user: "S Kaur (Punjab)", action: "Scan Submitted", details: "INS-1025 Organic Wheat Atta verified compliant" },
    { time: "1 hr ago", user: "Director DoCA (National)", action: "Rules Sync", details: "Updated Legal Metrology Packaged Commodities Schedule" },
    { time: "2 hrs ago", user: "A Menon (Kerala)", action: "Case Logged", details: "INS-1027 Roasted Coconut Oil verified" }
  ];

  /**
   * Demo label specimens for testing the AI OCR Scanner.
   */
  const DEMO_SPECIMENS = {
    tea: {
      id: "tea",
      name: "Masala Chai 500g (Compliant Label)",
      zone: "North East",
      state: "Assam",
      url: "assets/compliant_tea_label.jpg",
      expectedVerdict: "Compliant"
    },
    chips: {
      id: "chips",
      name: "Potato Chips 100g (Defective Label - Missing MRP & Care)",
      zone: "North",
      state: "Delhi UT",
      url: "assets/noncompliant_chips_label.jpg",
      expectedVerdict: "Non-Compliant"
    },
    rice: {
      id: "rice",
      name: "Basmati Rice Premium 5kg",
      zone: "North",
      state: "Delhi UT",
      url: "assets/compliant_tea_label.jpg",
      expectedVerdict: "Compliant"
    },
    oil: {
      id: "oil",
      name: "Sunflower Oil 1L",
      zone: "West",
      state: "Maharashtra",
      url: "assets/compliant_tea_label.jpg",
      expectedVerdict: "Compliant"
    },
    ghee: {
      id: "ghee",
      name: "Cow Ghee 500ml (Missing Currency Symbol)",
      zone: "North",
      state: "Haryana",
      url: "assets/noncompliant_chips_label.jpg",
      expectedVerdict: "Non-Compliant"
    }
  };

  /**
   * Seeds demo inspections and activities into localStorage.
   */
  function seed(force = false) {
    if (typeof localStorage === "undefined") {
      return DEMO_INSPECTIONS.slice();
    }

    const raw = localStorage.getItem(STORAGE_KEY_INSPECTIONS);
    let shouldSeed = force;

    if (!shouldSeed) {
      if (!raw) {
        shouldSeed = true;
      } else {
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some(r => !r.zone || !r.state)) {
            shouldSeed = true;
          }
        } catch (e) {
          shouldSeed = true;
        }
      }
    }

    if (shouldSeed) {
      const cloned = JSON.parse(JSON.stringify(DEMO_INSPECTIONS));
      try {
        localStorage.setItem(STORAGE_KEY_INSPECTIONS, JSON.stringify(cloned));
        localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(DEMO_ACTIVITIES));
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new CustomEvent("metro:notificationsUpdated"));
        }
      } catch (e) {
        console.error("DemoData: Failed to write to localStorage:", e);
      }
      return cloned;
    }

    try {
      return JSON.parse(raw) || DEMO_INSPECTIONS.slice();
    } catch (e) {
      return DEMO_INSPECTIONS.slice();
    }
  }

  function getDemoRecords() {
    return JSON.parse(JSON.stringify(DEMO_INSPECTIONS));
  }

  function getActivities() {
    return JSON.parse(JSON.stringify(DEMO_ACTIVITIES));
  }

  function getSpecimens() {
    return JSON.parse(JSON.stringify(DEMO_SPECIMENS));
  }

  return {
    seed: seed,
    getDemoRecords: getDemoRecords,
    getActivities: getActivities,
    getSpecimens: getSpecimens,
    inspections: DEMO_INSPECTIONS,
    activities: DEMO_ACTIVITIES,
    specimens: DEMO_SPECIMENS
  };
});
