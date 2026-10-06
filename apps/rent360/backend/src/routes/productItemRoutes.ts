import { Router } from "express";
import {
  getAllProductItems,
  createProductItem,
  getProductItemById,
  updateProductItem,
  deleteProductItem,
} from "../controllers/productItemController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createProductItemSchema,
  updateProductItemSchema,
} from "../validations/productItem.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllProductItems);
router.post(
  "/",
  validator({ body: createProductItemSchema }),
  createProductItem,
);
router.get("/:id", getProductItemById);
router.put(
  "/:id",
  validator({ body: updateProductItemSchema }),
  updateProductItem,
);
router.delete("/:id", deleteProductItem);
export default router;
