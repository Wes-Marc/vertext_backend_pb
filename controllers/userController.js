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

export async function home(req, res) {
    if (req.session.user) {
        // Fetch feed of posts for current user
        const posts = await Post.getFeed(req.session.user._id);
        res.render("home-dashboard", { posts: posts });
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

    // Retrieve post, follower, and following counts
    const postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
    const followerCountPromise = Follow.countFollowersById(req.profileUser._id);
    const followingCountPromise = Follow.countFollowingById(req.profileUser._id);
    const [postCount, followerCount, followingCount] = await Promise.all([
        postCountPromise,
        followerCountPromise,
        followingCountPromise,
    ]);

    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;

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
            title: `Profile for ${req.profileUser.username}`,
            currentPage: "posts",
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount,
            },
        });
    } catch (error) {
        console.error("Error in profilePostsScreen:", error);
        res.status(500).render("500");
    }
}

export async function profileFollowersScreen(req, res) {
    try {
        const followers = await Follow.getFollowersById(req.profileUser._id);
        res.render("profile-followers", {
            currentPage: "followers",
            followers: followers,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount,
            },
        });
    } catch (error) {
        console.error("Error in profileFollowersScreen:", error);
        res.status(500).render("500");
    }
}

export async function profileFollowingScreen(req, res) {
    try {
        const following = await Follow.getFollowingById(req.profileUser._id);
        res.render("profile-following", {
            currentPage: "following",
            following: following,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing,
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {
                postCount: req.postCount,
                followerCount: req.followerCount,
                followingCount: req.followingCount,
            },
        });
    } catch (error) {
        console.error("Error in profileFollowingScreen:", error);
        res.status(500).render("500");
    }
}
