import { Router } from "express";
import {
  getAllReminders,
  createReminder,
  getReminderById,
  updateReminder,
  deleteReminder,
} from "../controllers/reminderController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createReminderSchema,
  updateReminderSchema,
} from "../validations/reminder.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllReminders);
router.post("/", validator({ body: createReminderSchema }), createReminder);
router.get("/:id", getReminderById);
router.put("/:id", validator({ body: updateReminderSchema }), updateReminder);
router.delete("/:id", deleteReminder);
export default router;
