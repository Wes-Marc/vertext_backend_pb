import { Router } from "express";
import {
    mustBeLoggedIn,
    home,
    register,
    login,
    logout,
    ifUserExists,
    doesUsernameExist,
    doesEmailExist,
    sharedProfileData,
    profilePostsScreen,
    profileFollowersScreen,
    profileFollowingScreen,
} from "./controllers/userController.js";
import {
    viewCreateScreen,
    create,
    edit,
    deletePost,
    search,
    viewSingle,
    viewEditScreen,
} from "./controllers/postController.js";
import { addFollow, removeFollow } from "./controllers/followController.js";

const router = Router();

// User related routes
router.get("/", home);
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/doesUsernameExist", doesUsernameExist);
router.post("/doesEmailExist", doesEmailExist);

// Profile related routes
router.get("/profile/:username", ifUserExists, sharedProfileData, profilePostsScreen);
router.get("/profile/:username/followers", ifUserExists, sharedProfileData, profileFollowersScreen);
router.get("/profile/:username/following", ifUserExists, sharedProfileData, profileFollowingScreen);

// Post related routes
router.get("/create-post", mustBeLoggedIn, viewCreateScreen);
router.post("/create-post", mustBeLoggedIn, create);
router.get("/post/:id", viewSingle);
router.get("/post/:id/edit", mustBeLoggedIn, viewEditScreen);
router.post("/post/:id/edit", mustBeLoggedIn, edit);
router.post("/post/:id/delete", mustBeLoggedIn, deletePost);
router.post("/search", search);

// Follow related routes
router.post("/addFollow/:username", mustBeLoggedIn, addFollow);
router.post("/removeFollow/:username", mustBeLoggedIn, removeFollow);

export default router;
