import { Router } from "express";
import {
  getAllServiceTypes,
  createServiceType,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
} from "../controllers/serviceTypeController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createServiceTypeSchema,
  updateServiceTypeSchema,
} from "../validations/serviceType.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllServiceTypes);
router.post(
  "/",
  validator({ body: createServiceTypeSchema }),
  createServiceType,
);
router.get("/:id", getServiceTypeById);
router.put(
  "/:id",
  validator({ body: updateServiceTypeSchema }),
  updateServiceType,
);
router.delete("/:id", deleteServiceType);
export default router;
