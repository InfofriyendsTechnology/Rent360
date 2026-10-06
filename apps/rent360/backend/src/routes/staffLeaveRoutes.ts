import { Router } from "express";
import {
  getAllStaffLeaves,
  createStaffLeave,
  getStaffLeaveById,
  updateStaffLeave,
  deleteStaffLeave,
} from "../controllers/staffLeaveController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStaffLeaveSchema,
  updateStaffLeaveSchema,
} from "../validations/staffLeave.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStaffLeaves);
router.post("/", validator({ body: createStaffLeaveSchema }), createStaffLeave);
router.get("/:id", getStaffLeaveById);
router.put(
  "/:id",
  validator({ body: updateStaffLeaveSchema }),
  updateStaffLeave,
);
router.delete("/:id", deleteStaffLeave);
export default router;
