import { Router } from "express";
import {
  getAllStoreSubscriptions,
  createStoreSubscription,
  getStoreSubscriptionById,
  updateStoreSubscription,
  deleteStoreSubscription,
} from "../controllers/storeSubscriptionController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStoreSubscriptionSchema,
  updateStoreSubscriptionSchema,
} from "../validations/storeSubscription.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStoreSubscriptions);
router.post(
  "/",
  validator({ body: createStoreSubscriptionSchema }),
  createStoreSubscription,
);
router.get("/:id", getStoreSubscriptionById);
router.put(
  "/:id",
  validator({ body: updateStoreSubscriptionSchema }),
  updateStoreSubscription,
);
router.delete("/:id", deleteStoreSubscription);
export default router;
