const mongoose = require("mongoose");

/**
 * STRICT ENUMS (Option A)
 * Keep these lists as the single source of truth.
 */

const PRODUCT_TYPES = ["single", "bundle"];

const ROOM_TYPES = ["bedroom", "kitchen", "bathroom", "livingRoom"];

const CURRENCIES = ["USD"];

const PRIORITY_LEVELS = ["essential", "recommended", "optional"];

const BUDGET_TIERS = ["low", "mid", "high"];

const SPACE_REQUIREMENTS = ["low", "medium", "high"];

const CATEGORIES = [
  "mainFurniture",
  "kitchenEssentials",
  "bedroomItems",
  "bathroomEssentials",
  "storageOrganization",
  "cleaningMaintenance",
  "tools",
  "otherEssentials",
];

// Subcategory must be ONE of these (strictly controlled)
const SUBCATEGORIES = [
  // Main furniture
  "bed",
  "mattress",
  "dresser",
  "diningTable",
  "diningChair",
  "desk",
  "deskChair",
  "couch",
  "seating",

  // Kitchen essentials
  "plates",
  "bowls",
  "mugs",
  "glasses",
  "pots",
  "pans",
  "cuttingBoard",
  "utensils",
  "knife",
  "measuringCups",
  "smallAppliance",
  "foodStorage",
  "kitchenCleaning",
  "trashCan",

  // Bedroom items
  "sheets",
  "pillowcases",
  "comforter",
  "blanket",
  "pillow",
  "nightstand",
  "lamp",
  "mirror",
  "hanger",
  "closetOrganization",

  // Bathroom essentials
  "towel",
  "washcloth",
  "showerCurtain",
  "showerLiner",
  "bathMat",
  "toiletBrush",
  "toiletry",
  "toothbrushHolder",
  "toiletPaper",
  "trashBin",

  // Storage & organization
  "wallShelf",
  "floatingShelf",
  "ceilingHook",
  "hangingOrganizer",
  "storageBin",
  "underBedStorage",
  "extensionCord",
  "surgeProtector",

  // Cleaning & maintenance
  "vacuum",
  "mop",
  "cleanerMultiPurpose",
  "cleanerTile",
  "laundryDetergent",
  "plunger",
  "drainCleaner",

  // Tools
  "hammer",
  "screwdriver",
  "pliers",
  "drill",
  "screwsAndNails",

  // Other essentials
  "trashBags",
  "rubberGloves",
  "microfiberCloth",
  "airFreshener",
  "lightBulb",
];

// Tags (strictly controlled). Add more ONLY when needed.
const TAGS = [
  "compact",
  "spaceSaving",
  "easyClean",
  "lightweight",
  "portable",
  "cordManagement",
  "stackable",
  "dishwasherSafe",
  "nonSlip",
  "waterResistant",
  "ergonomic",
  "heavyDuty",
  "grabFriendly",
  "supportive",
  "toolFreeAssembly",
  "lowProfile",
];

// Accessibility features (expanded, real-world, but STILL strict)
const ACCESSIBILITY_FEATURES = [
  "wheelchairAccessible",
  "rollUnderClearance",
  "transferFriendly",
  "seatedUseFriendly",
  "armrestSupport",
  "lumbarSupport",
  "ergonomicDesign",
  "pressureReliefSurface",
  "lowProfileEntry",
  "lowReachHeight",
  "minimalForceRequired",
  "oneHandOperation",
  "easyGripHandles",
  "pushButtonControl",
  "clearVisualIndicators",
  "largePrintLabels",
  "highContrastMarkings",
  "nonSlipSurface",
  "reinforcedStability",
  "floorGripBase",
  "roundedEdges",
  "wallMountReady",
  "intuitiveLayout",
  "lightweightLift",
  "waterResistant",
  "moldResistant",
  "removablePartsAccessible",
  "antiTipStability",
  "softClose",
  "heightAdjustable",
];

// “features” list (optional, but strict). Add as you standardize.
const FEATURES = [
  "apartmentSized",
  "spaceEfficient",
  "toolFreeAssembly",
  "quickAssembly",
  "firmSupport",
  "easyCleanSurface",
  "builtInStorage",
  "washableCover",
  "plushComfort",
  "ergonomicSupport",
  "fitsSmallRooms",
  "cornerFriendly",
  "modularDesign",
  "easyToMove",
  "quietOperation",
  "multiOutlet",
  "surgeProtection",
  "nonSlipBase",
  "longCord",
  "compactFootprint",
];

// Bundle items (supports room bundles)
const bundleItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },

    productType: { type: String, required: true, enum: PRODUCT_TYPES },

    category: { type: String, required: true, enum: CATEGORIES },

    // strictly controlled per your instruction
    subcategory: { type: String, required: true, enum: SUBCATEGORIES },

    roomType: { type: String, required: true, enum: ROOM_TYPES },

    price: { type: Number, required: true, min: 0 },

    currency: { type: String, required: true, enum: CURRENCIES, default: "USD" },

    priorityLevel: { type: String, required: true, enum: PRIORITY_LEVELS },

    budgetTier: { type: String, required: true, enum: BUDGET_TIERS },

    spaceRequirement: { type: String, required: true, enum: SPACE_REQUIREMENTS },

    inStock: { type: Boolean, required: true, default: true },

    quantityAvailable: { type: Number, required: true, min: 0, default: 0 },

    tags: [{ type: String, enum: TAGS }],

    accessibilityFeatures: [{ type: String, enum: ACCESSIBILITY_FEATURES }],

    features: [{ type: String, enum: FEATURES }],

    shortDescription: { type: String, required: true, trim: true },

    longDescription: { type: String, trim: true, default: "" },

    primaryImage: { type: String, required: true, trim: true },

    galleryImages: [{ type: String, trim: true }],

    imageAltText: { type: String, trim: true, default: "" },

    // Only used when productType === "bundle"
    bundleItems: {
      type: [bundleItemSchema],
      default: undefined,
      validate: {
        validator: function (items) {
          if (this.productType !== "bundle") return true;
          return Array.isArray(items) && items.length > 0;
        },
        message: "bundleItems is required when productType is 'bundle'.",
      },
    },
  },
  { timestamps: true }
);

/**
 * Helpful indexes for your API filtering/sorting
 */
productSchema.index({ roomType: 1, category: 1, subcategory: 1 });
productSchema.index({ inStock: 1, quantityAvailable: 1 });
productSchema.index({ price: 1 });

module.exports = mongoose.model("Product", productSchema);
