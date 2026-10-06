import { Router } from "express";
import {
  getAllSubscriptionPlans,
  createSubscriptionPlan,
  getSubscriptionPlanById,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "../controllers/subscriptionPlanController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
} from "../validations/subscriptionPlan.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllSubscriptionPlans);
router.post(
  "/",
  validator({ body: createSubscriptionPlanSchema }),
  createSubscriptionPlan,
);
router.get("/:id", getSubscriptionPlanById);
router.put(
  "/:id",
  validator({ body: updateSubscriptionPlanSchema }),
  updateSubscriptionPlan,
);
router.delete("/:id", deleteSubscriptionPlan);
export default router;
