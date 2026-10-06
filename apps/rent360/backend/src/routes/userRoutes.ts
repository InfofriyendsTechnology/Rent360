import { Router } from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import validator from "../utils/validators";
import {
  createUserSchema,
  updateUserSchema,
} from "../validations/user.validation";

const router = Router();
router.use(authenticate);
router.get("/", getAllUsers);
router.post("/", validator({ body: createUserSchema }), createUser);
router.get("/:id", getUserById);
router.put("/:id", validator({ body: updateUserSchema }), updateUser);
router.delete("/:id", deleteUser);
export default router;
