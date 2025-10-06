import User from "../models/User.js";
import Post from "../models/Post.js";
import Follow from "../models/Follow.js";

export function mustBeLoggedIn(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash("errors", "You must be logged in to perform that action.");
        req.session.save(() => res.redirect("/"));
    }
}

export async function login(req, res) {
    try {
        let user = new User(req.body);
        const dbUser = await user.login();

        if (dbUser) {
            req.session.user = {
                username: dbUser.username,
                avatar: dbUser.avatar,
                _id: dbUser._id,
            };

            req.session.save(() => res.redirect("/"));
        }
    } catch (error) {
        req.flash("errors", error.message);
        req.session.save(() => res.redirect("/"));
    }
}

export function logout(req, res) {
    req.session.destroy(function () {
        res.redirect("/");
    });
}

export async function register(req, res) {
    try {
        let user = new User(req.body);
        const result = await user.register();

        if (result) {
            req.session.user = {
                username: user.data.username,
                avatar: user.data.avatar,
                _id: user.data._id,
            };
            req.session.save(() => res.redirect("/"));
        }
    } catch (regErrors) {
        regErrors.forEach((error) => req.flash("regErrors", error));
        req.session.save(() => res.redirect("/"));
    }
}

export function home(req, res) {
    if (req.session.user) {
        res.render("home-dashboard");
    } else {
        res.render("home-guest", { regErrors: req.flash("regErrors") });
    }
}

export async function ifUserExists(req, res, next) {
    try {
        const userDocument = await User.findByUsername(req.params.username);

        if (!userDocument) {
            return res.status(404).render("404");
        }

        req.profileUser = {
            _id: userDocument._id,
            username: userDocument.username,
            avatar: userDocument.avatar,
        };

        next();
    } catch (error) {
        console.error("Error in ifUserExists:", error);
        res.status(500).render("500");
    }
}

export async function sharedProfileData(req, res, next) {
    let isVisitorsProfile = false;
    let isFollowing = false;

    if (req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id);
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId);
    }

    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing;
    next();
}

export async function profilePostsScreen(req, res) {
    // Retrive from post model posts by author id
    try {
        const posts = await Post.findByAuthorId(req.profileUser._id);

        if (!posts) {
            return res.status(404).render("404");
        }

        res.render("profile", {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
        });
    } catch (error) {
        console.error("Error in profilePostsScreen:", error);
        res.status(500).render("500");
    }
}
