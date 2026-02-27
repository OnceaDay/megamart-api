/**
 * seed.js (root)
 * Seeds the Product collection from:
 *   src/data/bedroom.json
 *   src/data/kitchen.json
 *   src/data/bathroom.json
 *   src/data/livingRoom.json
 *
 * Strict mode: inserts records as-is (no field mapping).
 */

const connectToMongoDB = require("./src/db/connectToMongoDB");
const Product = require("./src/models/Product");

const bedroom = require("./src/data/bedroom.json");
const kitchen = require("./src/data/kitchen.json");
const bathroom = require("./src/data/bathroom.json");
const livingRoom = require("./src/data/livingRoom.json");

const all = [
  ...bedroom.map((p) => ({ ...p, roomType: "bedroom" })),
  ...kitchen.map((p) => ({ ...p, roomType: "kitchen" })),
  ...bathroom.map((p) => ({ ...p, roomType: "bathroom" })),
  ...livingRoom.map((p) => ({ ...p, roomType: "livingRoom" })),
];


function findInvalidAccessibilityFeatures(products) {
  const allowed = Product.schema.path("accessibilityFeatures").caster.enumValues;

  const bad = [];
  for (const p of products) {
    const arr = Array.isArray(p.accessibilityFeatures) ? p.accessibilityFeatures : [];
    const invalid = arr.filter((x) => !allowed.includes(x));
    if (invalid.length) bad.push({ sku: p.sku, invalid });
  }
  return bad;
}



function ensureUniqueSku(products) {
  const seen = new Set();
  const duplicates = [];

  for (const p of products) {
    const sku = (p.sku || "").trim();
    if (!sku) throw new Error("Seed failed: Missing sku on at least one product.");

    if (seen.has(sku)) duplicates.push(sku);
    seen.add(sku);
  }

  if (duplicates.length) {
    throw new Error(`Seed failed: Duplicate sku(s) found: ${duplicates.join(", ")}`);
  }
}

async function run() {
  try {
    await connectToMongoDB();
    console.log("Connected to MongoDB");

    // Guardrail: verify SKU uniqueness before touching DB
    ensureUniqueSku(all);

    // Clean seed (dev-friendly)
    const deleted = await Product.deleteMany({});
    console.log(`🧹 Cleared products collection: ${deleted.deletedCount} removed`);

    // Insert
    const inserted = await Product.insertMany(all, { ordered: true });
    console.log(`Inserted ${inserted.length} products`);

    // Simple counts
    const counts = inserted.reduce((acc, p) => {
      acc[p.roomType] = (acc[p.roomType] || 0) + 1;
      return acc;
    }, {});

    console.log("📦 Counts by roomType:", counts);

    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message || err);
    process.exit(1);
  }
}

run();
