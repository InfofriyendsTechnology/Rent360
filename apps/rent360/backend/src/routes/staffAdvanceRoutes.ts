import { Router } from "express";
import {
  getAllStaffAdvances,
  createStaffAdvance,
  getStaffAdvanceById,
  updateStaffAdvance,
  deleteStaffAdvance,
} from "../controllers/staffAdvanceController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStaffAdvanceSchema,
  updateStaffAdvanceSchema,
} from "../validations/staffAdvance.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStaffAdvances);
router.post(
  "/",
  validator({ body: createStaffAdvanceSchema }),
  createStaffAdvance,
);
router.get("/:id", getStaffAdvanceById);
router.put(
  "/:id",
  validator({ body: updateStaffAdvanceSchema }),
  updateStaffAdvance,
);
router.delete("/:id", deleteStaffAdvance);
export default router;
