import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rootRoutes from "./routes/index";
import responseHandler from "./utils/responseHandler";
import { setupSuperAdmin } from "./utils/setupSuperAdmin";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 61026;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Health Check
app.get("/api/health", (req, res) => {
  return responseHandler.success(res, "Rent360 Backend is running smoothly!");
});

// Routes
app.use("/api", rootRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Rent360 Backend is running on http://localhost:${PORT}`);
  await setupSuperAdmin();
});
