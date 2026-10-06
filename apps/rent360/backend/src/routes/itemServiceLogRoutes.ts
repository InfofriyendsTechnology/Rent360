import { Router } from "express";
import {
  getAllItemServiceLogs,
  createItemServiceLog,
  getItemServiceLogById,
  updateItemServiceLog,
  deleteItemServiceLog,
} from "../controllers/itemServiceLogController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createItemServiceLogSchema,
  updateItemServiceLogSchema,
} from "../validations/itemServiceLog.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllItemServiceLogs);
router.post(
  "/",
  validator({ body: createItemServiceLogSchema }),
  createItemServiceLog,
);
router.get("/:id", getItemServiceLogById);
router.put(
  "/:id",
  validator({ body: updateItemServiceLogSchema }),
  updateItemServiceLog,
);
router.delete("/:id", deleteItemServiceLog);
export default router;
