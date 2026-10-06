import { Router } from "express";
import {
  getAllRetailSaleItems,
  createRetailSaleItem,
  getRetailSaleItemById,
  updateRetailSaleItem,
  deleteRetailSaleItem,
} from "../controllers/retailSaleItemController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createRetailSaleItemSchema,
  updateRetailSaleItemSchema,
} from "../validations/retailSaleItem.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllRetailSaleItems);
router.post(
  "/",
  validator({ body: createRetailSaleItemSchema }),
  createRetailSaleItem,
);
router.get("/:id", getRetailSaleItemById);
router.put(
  "/:id",
  validator({ body: updateRetailSaleItemSchema }),
  updateRetailSaleItem,
);
router.delete("/:id", deleteRetailSaleItem);
export default router;
