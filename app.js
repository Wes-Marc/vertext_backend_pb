import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import { client } from "./db.js";
import router from "./router.js";

const app = express();
const sessionOptions = session({
    secret: "JavaScript is soooo cool",
    store: MongoStore.create({ client: client, dbName: process.env.DB_NAME }),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: "strict" },
});

app.use(sessionOptions);
app.use(flash());

app.use((req, res, next) => {
    // Make all error and success flash messages available from all templates
    res.locals.errors = req.flash("errors");
    res.locals.success = req.flash("success");

    // Make current user id available on req object
    if (req.session.user) {
        req.visitorId = req.session.user._id;
    } else {
        req.visitorId = 0;
    }

    // Make user session data available in view templates
    res.locals.user = req.session.user;
    next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

async function start() {
    await client.connect();
    app.listen(process.env.PORT);
}

start();
