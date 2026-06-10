/**
 * Demo Data Seeding Script
 *
 * Populates the DB with realistic tribal-mart demo content:
 *  - 1 admin (admin@setu.com / admin123) – created by seedAdmin.js if missing
 *  - 2 agencies (Bhil Crafts Cooperative, Santhal Arts Collective)
 *  - 1 agent (Birsa Helper) — managing both agencies
 *  - 2 customers (Tiya Reader, Rohan Buyer)
 *  - 6 diverse tribal craft products (mix of categories, statuses)
 *  - Sample reviews
 *
 * Usage:  node scripts/seedDemo.js
 *
 * Safe to run multiple times — uses upsert / find-or-create semantics.
 */

const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const User = require("../models/User.js");
const Product = require("../models/Product.js");
const Review = require("../models/Review.js");

const pw = (plain) => bcrypt.hash(plain, 10);

async function upsertUser({ email, name, role, password, address, agent }) {
  let user = await User.findOne({ email });
  if (user) {
    let dirty = false;
    if (user.name !== name) { user.name = name; dirty = true; }
    if (address !== undefined && user.address !== address) { user.address = address; dirty = true; }
    if (agent !== undefined && String(user.agent || '') !== String(agent || '')) { user.agent = agent; dirty = true; }
    if (dirty) await user.save();
    return user;
  }
  return User.create({
    email, name, role,
    password: await pw(password),
    ...(address ? { address } : {}),
    ...(agent  ? { agent }  : {}),
  });
}

async function upsertProduct(p) {
  const existing = await Product.findOne({ title: p.title, agency: p.agency });
  if (existing) {
    Object.assign(existing, p);
    return existing.save();
  }
  return Product.create(p);
}

async function upsertReview({ product, customer, customerName, rating, comment }) {
  return Review.findOneAndUpdate(
    { product, customer },
    { product, customer, customerName, rating, comment },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

(async () => {
  try {
    console.log("Connecting to MongoDB…");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.\n");

    // ── Users ─────────────────────────────────────────────
    console.log("• Seeding users…");
    const agent = await upsertUser({
      email: "agent@demo.com",
      name: "Birsa Helper",
      role: "agent",
      password: "demo123",
      address: "Khunti, Jharkhand"
    });

    const agency1 = await upsertUser({
      email: "agency@demo.com",
      name: "Bhil Crafts Cooperative",
      role: "agency",
      password: "demo123",
      agent: agent._id
    });

    const agency2 = await upsertUser({
      email: "santhal@demo.com",
      name: "Santhal Arts Collective",
      role: "agency",
      password: "demo123",
    });

    const customer1 = await upsertUser({
      email: "customer@demo.com",
      name: "Tiya Reader",
      role: "customer",
      password: "demo123",
    });

    const customer2 = await upsertUser({
      email: "rohan@demo.com",
      name: "Rohan Buyer",
      role: "customer",
      password: "demo123",
    });

    console.log(`  ✓ Agent:    ${agent.email}`);
    console.log(`  ✓ Agency 1: ${agency1.email} (managed by agent)`);
    console.log(`  ✓ Agency 2: ${agency2.email}`);
    console.log(`  ✓ Customer: ${customer1.email}, ${customer2.email}`);

    // ── Products ──────────────────────────────────────────
    console.log("\n• Seeding products…");
    const products = [
      {
        title: "Pithora Wall Painting", description: "Hand-painted Pithora narrative panel by Bhil artisans — vibrant scenes of village life on cotton canvas.",
        category: "Others", originalPrice: 8500, sellingPrice: 6800, quantity: 3, condition: "New",
        images: ["https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=720&q=80&auto=format&fit=crop"],
        agency: agency1._id, agencyName: agency1.name, status: "approved"
      },
      {
        title: "Hand-Coiled Terracotta Bowl Set", description: "Set of three terracotta bowls, hand-coiled and pit-fired by Bhil potters. Food-safe natural finish.",
        category: "Others", originalPrice: 3200, sellingPrice: 2400, quantity: 12, condition: "New",
        images: ["https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=720&q=80&auto=format&fit=crop"],
        agency: agency1._id, agencyName: agency1.name, status: "approved"
      },
      {
        title: "Sohrai Wall Art Panel", description: "Santhal Sohrai mural panel — ochre and white motifs on terracotta wash. Made in Hazaribagh.",
        category: "Others", originalPrice: 12000, sellingPrice: 9500, quantity: 2, condition: "New",
        images: ["https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=720&q=80&auto=format&fit=crop"],
        agency: agency2._id, agencyName: agency2.name, status: "approved"
      },
      {
        title: "Dhokra Brass Tribal Figurine", description: "Lost-wax brass casting of a tribal musician. 6\" tall. From Bastar Dhokra artisans.",
        category: "Others", originalPrice: 4800, sellingPrice: 3900, quantity: 5, condition: "New",
        images: ["https://images.unsplash.com/photo-1605733513597-a8f8341084e6?w=720&q=80&auto=format&fit=crop"],
        agency: agency2._id, agencyName: agency2.name, status: "approved"
      },
      {
        title: "Bhil Hand-Woven Throw", description: "Naturally dyed cotton throw with traditional Bhil borders. 60\" x 90\".",
        category: "Clothing", originalPrice: 5400, sellingPrice: 4200, quantity: 8, condition: "New",
        images: ["https://images.unsplash.com/photo-1604782206219-3b9576575203?w=720&q=80&auto=format&fit=crop"],
        agency: agency1._id, agencyName: agency1.name, status: "approved"
      },
      {
        title: "Sabai Grass Storage Basket", description: "Coiled Sabai grass basket from Santhal weavers. Naturally dyed reeds, sturdy 12\" diameter.",
        category: "Others", originalPrice: 2200, sellingPrice: 1750, quantity: 15, condition: "New",
        images: ["https://images.unsplash.com/photo-1604147495798-57beb5d6af73?w=720&q=80&auto=format&fit=crop"],
        agency: agency2._id, agencyName: agency2.name, status: "pending"
      },
    ];

    const saved = [];
    for (const p of products) {
      const s = await upsertProduct(p);
      saved.push(s);
      console.log(`  ✓ ${s.title}  [${s.status}]`);
    }

    // ── Reviews ───────────────────────────────────────────
    console.log("\n• Seeding reviews…");
    const approved = saved.filter((p) => p.status === "approved");
    if (approved[0]) {
      await upsertReview({
        product: approved[0]._id, customer: customer1._id, customerName: customer1.name,
        rating: 5, comment: "Absolutely stunning — the colours are richer in person. The story behind the painting was a delight to read."
      });
      await upsertReview({
        product: approved[0]._id, customer: customer2._id, customerName: customer2.name,
        rating: 4, comment: "Beautiful piece, shipped quickly. Lost half a star for slightly tight packing."
      });
    }
    if (approved[1]) {
      await upsertReview({
        product: approved[1]._id, customer: customer1._id, customerName: customer1.name,
        rating: 5, comment: "Use these every day. Sturdy, food-safe, and feel of pure earth. Will buy again."
      });
    }
    if (approved[2]) {
      await upsertReview({
        product: approved[2]._id, customer: customer2._id, customerName: customer2.name,
        rating: 5, comment: "A gorgeous statement piece — neighbours keep asking where it's from."
      });
    }
    console.log("  ✓ Reviews seeded");

    console.log("\n✅ Demo data ready.\n");
    console.log("Login credentials (all password: demo123 except admin):");
    console.log("  • Admin    → admin@setu.com / admin123");
    console.log("  • Agency   → agency@demo.com (Bhil cooperative, has an agent)");
    console.log("  • Agency 2 → santhal@demo.com (no agent)");
    console.log("  • Agent    → agent@demo.com (managing Bhil cooperative)");
    console.log("  • Customer → customer@demo.com");
    console.log("  • Customer → rohan@demo.com\n");
  } catch (e) {
    console.error("\n❌ Seed failed:", e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
