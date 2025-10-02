import { Router } from "express";
import { mustBeLoggedIn, home, register, login, logout, ifUserExists, profilePostsScreen } from "./controllers/userController.js";
import { viewCreateScreen, create, edit, deletePost, viewSingle, viewEditScreen } from "./controllers/postController.js";

const router = Router();

// User related routes
router.get("/", home);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Profile related routes
router.get("/profile/:username", ifUserExists, profilePostsScreen);

// Post related routes
router.get("/create-post", mustBeLoggedIn, viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, create);
router.get("/post/:id", viewSingle);
router.get("/post/:id/edit", mustBeLoggedIn, viewEditScreen);
router.post("/post/:id/edit", mustBeLoggedIn, edit);
router.post("/post/:id/delete", mustBeLoggedIn, deletePost);

export default router;
