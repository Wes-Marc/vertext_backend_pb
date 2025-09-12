import { Router } from "express";
import { home, register, login, logout } from "./controllers/userController.js";

const router = Router();

router.get("/", home);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
