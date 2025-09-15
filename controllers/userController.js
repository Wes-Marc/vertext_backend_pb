import User from "../models/User.js";

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
        req.session.user = {
            username: dbUser.username,
            avatar: user.avatar,
            _id: user.data._id,
        };
        req.session.save(() => res.redirect("/"));
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
    let user = new User(req.body);
    try {
        await user.register();
        req.session.user = {
            username: user.data.username,
            avatar: user.avatar,
            _id: user.data._id,
        };
        req.session.save(() => res.redirect("/"));
    } catch (regErrors) {
        regErrors.forEach((error) => req.flash("regErrors", error));
        req.session.save(() => res.redirect("/"));
    }
}

export function home(req, res) {
    if (req.session.user) {
        res.render("home-dashboard");
    } else {
        res.render("home-guest", {
            errors: req.flash("errors"),
            regErrors: req.flash("regErrors"),
        });
    }
}
