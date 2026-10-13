import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rootRoutes from "./routes/index";
import responseHandler from "./utils/responseHandler";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Global Health Check
app.get("/api/health", (req, res) => {
  return responseHandler.success(res, "Rent360 Backend is running smoothly!");
});

app.get("/", (req, res) => {
  return responseHandler.success(res, "Rent360 API Server is active!");
});

// Routes
app.use("/api", rootRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

export default app;
