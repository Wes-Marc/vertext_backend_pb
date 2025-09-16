import { Router } from "express";
import { mustBeLoggedIn, home, register, login, logout } from "./controllers/userController.js";
import { viewCreateScreen, create, viewSingle } from "./controllers/postController.js";

const router = Router();

// User related routes
router.get("/", home);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Post related routes
router.get("/create-post", mustBeLoggedIn, viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, create);
router.get("/post/:id", viewSingle);

export default router;
