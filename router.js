import { Router } from "express";
import { mustBeLoggedIn, home, register, login, logout } from "./controllers/userController.js";
import { viewCreateScreen, create } from "./controllers/postController.js";

const router = Router();

// User related routes
router.get("/", home);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Post related routes
router.get("/create-post", mustBeLoggedIn, viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, create);

export default router;
