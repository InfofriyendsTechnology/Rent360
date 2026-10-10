import { Router } from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import validator from "../utils/validators";
import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation";

const router = Router();
router.use(authenticate);

const requireManageStaff = authorize(["ALL", "SETTINGS_MANAGE"]);

router.get("/", requireManageStaff, getAllUsers);
router.post("/", requireManageStaff, validator({ body: createUserSchema }), createUser);
router.get("/:id", requireManageStaff, getUserById);
router.put("/:id", validator({ body: updateUserSchema }), updateUser);
router.delete("/:id", requireManageStaff, deleteUser);
export default router;
