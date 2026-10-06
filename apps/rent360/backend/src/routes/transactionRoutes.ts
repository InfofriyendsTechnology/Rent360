import { Router } from "express";
import {
  getAllTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createTransactionSchema,
  updateTransactionSchema,
} from "../validations/transaction.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllTransactions);
router.post(
  "/",
  validator({ body: createTransactionSchema }),
  createTransaction,
);
router.get("/:id", getTransactionById);
router.put(
  "/:id",
  validator({ body: updateTransactionSchema }),
  updateTransaction,
);
router.delete("/:id", deleteTransaction);
export default router;
