import { Router } from "express";
import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/product.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllProducts);
router.post("/", validator({ body: createProductSchema }), createProduct);
router.get("/:id", getProductById);
router.put("/:id", validator({ body: updateProductSchema }), updateProduct);
router.delete("/:id", deleteProduct);
export default router;
