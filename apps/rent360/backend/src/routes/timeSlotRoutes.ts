import { Router } from "express";
import {
  getAllTimeSlots,
  createTimeSlot,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
} from "../controllers/timeSlotController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createTimeSlotSchema,
  updateTimeSlotSchema,
} from "../validations/timeSlot.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllTimeSlots);
router.post("/", validator({ body: createTimeSlotSchema }), createTimeSlot);
router.get("/:id", getTimeSlotById);
router.put("/:id", validator({ body: updateTimeSlotSchema }), updateTimeSlot);
router.delete("/:id", deleteTimeSlot);
export default router;
