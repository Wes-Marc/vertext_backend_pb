import User from "../models/User.js";

export async function login(req, res) {
    try {
        let user = new User(req.body);
        const result = await user.login();
        res.send(result);
    } catch (error) {
        res.send(error);
    }
}

export function logout() {}

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
    res.render("home-guest");
}
