import { Router } from "express";
import {
  getAllAttendances,
  createAttendance,
  getAttendanceById,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "../validations/attendance.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllAttendances);
router.post("/", validator({ body: createAttendanceSchema }), createAttendance);
router.get("/:id", getAttendanceById);
router.put(
  "/:id",
  validator({ body: updateAttendanceSchema }),
  updateAttendance,
);
router.delete("/:id", deleteAttendance);
export default router;
