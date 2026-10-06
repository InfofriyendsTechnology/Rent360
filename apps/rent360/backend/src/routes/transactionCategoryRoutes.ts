import { Router } from "express";
import {
  getAllTransactionCategorys,
  createTransactionCategory,
  getTransactionCategoryById,
  updateTransactionCategory,
  deleteTransactionCategory,
} from "../controllers/transactionCategoryController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createTransactionCategorySchema,
  updateTransactionCategorySchema,
} from "../validations/transactionCategory.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllTransactionCategorys);
router.post(
  "/",
  validator({ body: createTransactionCategorySchema }),
  createTransactionCategory,
);
router.get("/:id", getTransactionCategoryById);
router.put(
  "/:id",
  validator({ body: updateTransactionCategorySchema }),
  updateTransactionCategory,
);
router.delete("/:id", deleteTransactionCategory);
export default router;
