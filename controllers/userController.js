import User from "../models/User.js";

export async function login(req, res) {
    try {
        let user = new User(req.body);
        const dbUser = await user.login();
        req.session.user = { username: dbUser.username };
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
        req.session.user = { username: user.data.username };
        req.session.save(() => res.redirect("/"));
    } catch (regErrors) {
        regErrors.forEach(error => req.flash("regErrors", error));
        req.session.save(() => res.redirect("/"));
    }
}

export function home(req, res) {
    if (req.session.user) {
        res.render("home-dashboard", { username: req.session.user.username });
    } else {
        res.render("home-guest", { errors: req.flash("errors"), regErrors: req.flash("regErrors") });
    }
}
