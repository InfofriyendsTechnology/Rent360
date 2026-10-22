import { Router } from "express";
import {
  getCategoryAccessoryLinks,
  linkAccessoriesToCategory,
  deleteCategoryAccessoryLink,
} from "../controllers/categoryAccessoryLinkController";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", getCategoryAccessoryLinks);
router.post("/", linkAccessoriesToCategory);
router.delete("/:id", deleteCategoryAccessoryLink);

export default router;
