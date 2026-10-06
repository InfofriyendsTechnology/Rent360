import { Router } from "express";
import {
  getAllPurchaseInvoices,
  createPurchaseInvoice,
  getPurchaseInvoiceById,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
} from "../controllers/purchaseInvoiceController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
} from "../validations/purchaseInvoice.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllPurchaseInvoices);
router.post(
  "/",
  validator({ body: createPurchaseInvoiceSchema }),
  createPurchaseInvoice,
);
router.get("/:id", getPurchaseInvoiceById);
router.put(
  "/:id",
  validator({ body: updatePurchaseInvoiceSchema }),
  updatePurchaseInvoice,
);
router.delete("/:id", deletePurchaseInvoice);
export default router;
