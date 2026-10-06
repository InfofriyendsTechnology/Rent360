import { Router } from "express";
import {
  getAllPaymentModes,
  createPaymentMode,
  getPaymentModeById,
  updatePaymentMode,
  deletePaymentMode,
} from "../controllers/paymentModeController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createPaymentModeSchema,
  updatePaymentModeSchema,
} from "../validations/paymentMode.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllPaymentModes);
router.post(
  "/",
  validator({ body: createPaymentModeSchema }),
  createPaymentMode,
);
router.get("/:id", getPaymentModeById);
router.put(
  "/:id",
  validator({ body: updatePaymentModeSchema }),
  updatePaymentMode,
);
router.delete("/:id", deletePaymentMode);
export default router;
