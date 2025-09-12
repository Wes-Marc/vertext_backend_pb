import User from "../models/User.js";

export async function login(req, res) {
    try {
        let user = new User(req.body);
        const dbUser = await user.login();
        req.session.user = { username: dbUser.username };
        req.session.save(() => res.redirect("/"));
    } catch (error) {
        res.send(error.message);
    }
}

export function logout(req, res) {
    req.session.destroy(function () {
        res.redirect("/");
    });
}

export async function register(req, res) {
    let user = new User(req.body);
    await user.register();
    if (user.errors.length) {
        res.send(user.errors);
    } else {
        res.send("There are no errors.");
    }
}

export function home(req, res) {
    if (req.session.user) {
        res.render("home-dashboard", { username: req.session.user.username });
    } else {
        res.render("home-guest");
    }
}
