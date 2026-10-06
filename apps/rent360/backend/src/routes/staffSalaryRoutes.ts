import { Router } from "express";
import {
  getAllStaffSalarys,
  createStaffSalary,
  getStaffSalaryById,
  updateStaffSalary,
  deleteStaffSalary,
} from "../controllers/staffSalaryController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createStaffSalarySchema,
  updateStaffSalarySchema,
} from "../validations/staffSalary.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllStaffSalarys);
router.post(
  "/",
  validator({ body: createStaffSalarySchema }),
  createStaffSalary,
);
router.get("/:id", getStaffSalaryById);
router.put(
  "/:id",
  validator({ body: updateStaffSalarySchema }),
  updateStaffSalary,
);
router.delete("/:id", deleteStaffSalary);
export default router;
