import { Router } from "express";
import {
  getAllCategorys,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../validations/category.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllCategorys);
router.post("/", validator({ body: createCategorySchema }), createCategory);
router.get("/:id", getCategoryById);
router.put("/:id", validator({ body: updateCategorySchema }), updateCategory);
router.delete("/:id", deleteCategory);
export default router;
