import { Router } from "express";
import {
  getAllPurchaseItems,
  createPurchaseItem,
  getPurchaseItemById,
  updatePurchaseItem,
  deletePurchaseItem,
} from "../controllers/purchaseItemController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createPurchaseItemSchema,
  updatePurchaseItemSchema,
} from "../validations/purchaseItem.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllPurchaseItems);
router.post(
  "/",
  validator({ body: createPurchaseItemSchema }),
  createPurchaseItem,
);
router.get("/:id", getPurchaseItemById);
router.put(
  "/:id",
  validator({ body: updatePurchaseItemSchema }),
  updatePurchaseItem,
);
router.delete("/:id", deletePurchaseItem);
export default router;
