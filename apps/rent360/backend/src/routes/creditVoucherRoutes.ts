import { Router } from "express";
import {
  getAllCreditVouchers,
  createCreditVoucher,
  getCreditVoucherById,
  updateCreditVoucher,
  deleteCreditVoucher,
} from "../controllers/creditVoucherController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createCreditVoucherSchema,
  updateCreditVoucherSchema,
} from "../validations/creditVoucher.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllCreditVouchers);
router.post(
  "/",
  validator({ body: createCreditVoucherSchema }),
  createCreditVoucher,
);
router.get("/:id", getCreditVoucherById);
router.put(
  "/:id",
  validator({ body: updateCreditVoucherSchema }),
  updateCreditVoucher,
);
router.delete("/:id", deleteCreditVoucher);
export default router;
