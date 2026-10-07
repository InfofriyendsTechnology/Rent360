import { Router } from "express";
import { getDashboardStats, getSuperAdminStats } from "../controllers/analyticsController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/dashboard", getDashboardStats);
router.get("/superadmin", getSuperAdminStats);

export default router;
