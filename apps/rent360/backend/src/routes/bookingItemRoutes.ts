import { Router } from "express";
import {
  getAllBookingItems,
  createBookingItem,
  getBookingItemById,
  updateBookingItem,
  deleteBookingItem,
} from "../controllers/bookingItemController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createBookingItemSchema,
  updateBookingItemSchema,
} from "../validations/bookingItem.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllBookingItems);
router.post(
  "/",
  validator({ body: createBookingItemSchema }),
  createBookingItem,
);
router.get("/:id", getBookingItemById);
router.put(
  "/:id",
  validator({ body: updateBookingItemSchema }),
  updateBookingItem,
);
router.delete("/:id", deleteBookingItem);
export default router;
