import { Router } from "express";
import {
  getAllAuditLogs,
  createAuditLog,
  getAuditLogById,
  updateAuditLog,
  deleteAuditLog,
} from "../controllers/auditLogController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createAuditLogSchema,
  updateAuditLogSchema,
} from "../validations/auditLog.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllAuditLogs);
router.post("/", validator({ body: createAuditLogSchema }), createAuditLog);
router.get("/:id", getAuditLogById);
router.put("/:id", validator({ body: updateAuditLogSchema }), updateAuditLog);
router.delete("/:id", deleteAuditLog);
export default router;
