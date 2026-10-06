import { Router } from "express";
import {
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/roleController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createRoleSchema,
  updateRoleSchema,
} from "../validations/role.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllRoles);
router.post("/", validator({ body: createRoleSchema }), createRole);
router.get("/:id", getRoleById);
router.put("/:id", validator({ body: updateRoleSchema }), updateRole);
router.delete("/:id", deleteRole);
export default router;
