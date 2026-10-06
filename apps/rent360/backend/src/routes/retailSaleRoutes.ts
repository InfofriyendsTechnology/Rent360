import { Router } from "express";
import {
  getAllRetailSales,
  createRetailSale,
  getRetailSaleById,
  updateRetailSale,
  deleteRetailSale,
} from "../controllers/retailSaleController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createRetailSaleSchema,
  updateRetailSaleSchema,
} from "../validations/retailSale.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllRetailSales);
router.post("/", validator({ body: createRetailSaleSchema }), createRetailSale);
router.get("/:id", getRetailSaleById);
router.put(
  "/:id",
  validator({ body: updateRetailSaleSchema }),
  updateRetailSale,
);
router.delete("/:id", deleteRetailSale);
export default router;
