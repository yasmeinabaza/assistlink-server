import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import db from "./db/db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import requestRoutes from "./routes/requests.js";
import careCenterRoutes from "./routes/carecenters.js";
import engineerRoutes from "./routes/engineers.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("AssistLink API (PostgreSQL) is running");
});

console.log("Registering routes...");
app.use("/api/auth", authRoutes);
console.log("✅ /api/auth registered");

app.use("/api/users", userRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/carecenters", careCenterRoutes);
app.use("/api/engineers", engineerRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

db.connect().then(() => {
  console.log("Connected to PostgreSQL");
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Database connection error:", err);
});