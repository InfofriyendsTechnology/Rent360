import { Router } from "express";
import {
  getAllSizes,
  createSize,
  getSizeById,
  updateSize,
  deleteSize,
} from "../controllers/sizeController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", getAllSizes);
router.post("/", createSize);
router.get("/:id", getSizeById);
router.put("/:id", updateSize);
router.delete("/:id", deleteSize);

export default router;
