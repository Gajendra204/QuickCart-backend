require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./src/config/db");
const shopkeeperRoutes = require("./src/routes/shopkeeperRoutes");
const userRoutes = require("./src/routes/userRouter");

const app = express();
const port = process.env.PORT || 5555;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(
  "/barcodes",
  express.static(path.join(__dirname, "src/public/barcodes"))
);
app.use("/uploads", express.static("uploads"));

// Database Connection
connectDB();

// Routes
app.use("/api/shopkeeper", shopkeeperRoutes);
app.use("/api", userRoutes);

// Health check
app.get("/health", (req, res) => res.send("all okay"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
