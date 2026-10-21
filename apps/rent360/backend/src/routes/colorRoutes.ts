import { Router } from "express";
import {
  getAllColors,
  createColor,
  getColorById,
  updateColor,
  deleteColor,
} from "../controllers/colorController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", getAllColors);
router.post("/", createColor);
router.get("/:id", getColorById);
router.put("/:id", updateColor);
router.delete("/:id", deleteColor);

export default router;
