import { Router } from "express";
import {
  getAllVendors,
  createVendor,
  getVendorById,
  updateVendor,
  deleteVendor,
} from "../controllers/vendorController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createVendorSchema,
  updateVendorSchema,
} from "../validations/vendor.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllVendors);
router.post("/", validator({ body: createVendorSchema }), createVendor);
router.get("/:id", getVendorById);
router.put("/:id", validator({ body: updateVendorSchema }), updateVendor);
router.delete("/:id", deleteVendor);
export default router;
