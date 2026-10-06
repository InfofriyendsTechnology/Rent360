import { Router } from "express";
import {
  getAllVendorTypes,
  createVendorType,
  getVendorTypeById,
  updateVendorType,
  deleteVendorType,
} from "../controllers/vendorTypeController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createVendorTypeSchema,
  updateVendorTypeSchema,
} from "../validations/vendorType.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllVendorTypes);
router.post("/", validator({ body: createVendorTypeSchema }), createVendorType);
router.get("/:id", getVendorTypeById);
router.put(
  "/:id",
  validator({ body: updateVendorTypeSchema }),
  updateVendorType,
);
router.delete("/:id", deleteVendorType);
export default router;
