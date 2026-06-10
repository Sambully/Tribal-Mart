const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dns = require("dns");
require("dotenv").config({ path: path.join(__dirname, ".env") });

dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Create uploads directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads/documents');
const productsDir = path.join(__dirname, 'uploads/products');
const avatarsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/customer", require("./routes/customerRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/documents", require("./routes/documentRoutes"));
app.use("/api/agents", require("./routes/agentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
app.use("/api/returns", require("./routes/returnRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));

// MongoDB Connection
if (!process.env.MONGO_URI) {
  console.error("\n✗ MONGO_URI is not set in backend/.env — see .env.example for the template.\n");
  process.exit(1);
}
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log("DB Error:", err));

// Test Route
app.get("/", (req, res) => {
    res.send("Setu Backend Running Successfully!");
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));