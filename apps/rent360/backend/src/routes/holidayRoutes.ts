import { Router } from "express";
import {
  getAllHolidays,
  createHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
} from "../controllers/holidayController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createHolidaySchema,
  updateHolidaySchema,
} from "../validations/holiday.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllHolidays);
router.post("/", validator({ body: createHolidaySchema }), createHoliday);
router.get("/:id", getHolidayById);
router.put("/:id", validator({ body: updateHolidaySchema }), updateHoliday);
router.delete("/:id", deleteHoliday);
export default router;
