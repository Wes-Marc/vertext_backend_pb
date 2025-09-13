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
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: "strict" }
});

app.use(sessionOptions);
app.use(flash());

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
