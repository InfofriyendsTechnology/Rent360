import { Router } from "express";
import {
  getAllStoreBankAccounts,
  createStoreBankAccount,
  getStoreBankAccountById,
  updateStoreBankAccount,
  deleteStoreBankAccount,
} from "../controllers/storeBankAccountController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStoreBankAccountSchema,
  updateStoreBankAccountSchema,
} from "../validations/storeBankAccount.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStoreBankAccounts);
router.post(
  "/",
  validator({ body: createStoreBankAccountSchema }),
  createStoreBankAccount,
);
router.get("/:id", getStoreBankAccountById);
router.put(
  "/:id",
  validator({ body: updateStoreBankAccountSchema }),
  updateStoreBankAccount,
);
router.delete("/:id", deleteStoreBankAccount);
export default router;
