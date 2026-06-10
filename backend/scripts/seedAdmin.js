/**
 * Admin User Seeding Script
 * 
 * This script creates an initial admin user for the Setu platform.
 * Run this script manually when setting up the application.
 * 
 * Usage:
 *   node scripts/seedAdmin.js
 * 
 * Environment Variables:
 *   MONGO_URI - MongoDB connection string (default: mongodb://localhost:27017/setu)
 *   ADMIN_EMAIL - Admin email (default: admin@setu.com)
 *   ADMIN_PASSWORD - Admin password (default: admin123)
 *   ADMIN_NAME - Admin name (default: System Administrator)
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dns = require("dns");
const User = require("../models/User.js");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@setu.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Administrator";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/setu";

async function seedAdmin() {
    try {
        // Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
        if (existingAdmin) {
            console.log(`Admin user already exists with email: ${ADMIN_EMAIL}`);
            console.log("If you want to reset the admin password, delete the existing admin user first.");
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        // Create admin user
        const adminUser = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin"
        });

        console.log("\n✅ Admin user created successfully!");
        console.log("\nAdmin Details:");
        console.log(`  Name: ${adminUser.name}`);
        console.log(`  Email: ${adminUser.email}`);
        console.log(`  Role: ${adminUser.role}`);
        console.log(`  ID: ${adminUser._id}`);
        console.log("\n⚠️  IMPORTANT: Change the default password after first login!");

    } catch (error) {
        console.error("\n❌ Error creating admin user:", error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");
    }
}

// Run the seed function
seedAdmin();
