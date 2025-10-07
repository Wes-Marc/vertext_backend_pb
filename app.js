import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "connect-flash";
import { marked as markdown } from "marked";
import sanitize from "sanitize-html";
import { client } from "./db.js";
import router from "./router.js";
import { createServer } from "http";
import { Server } from "socket.io";

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
    // Make markdown function available within ejs templates
    res.locals.filterUserHTML = (content) => {
        return sanitize(markdown.parse(content), {
            allowedTags: ["p", "br", "ul", "ol", "li", "strong", "bold", "i", "em", "h1", "h2", "h3", "h4", "h5", "h6"],
            allowedAttributes: {},
        });
    };

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

const server = createServer(app);

const io = new Server(server);

io.use((socket, next) => {
    sessionOptions(socket.request, socket.request.res || {}, next);
});

io.on("connection", (socket) => {
    if (socket.request.session.user) {
        const user = socket.request.session.user;

        socket.emit("welcome", { username: user.username, avatar: user.avatar });

        socket.on("chatMessageFromBrowser", (data) => {
            socket.broadcast.emit("chatMessageFromServer", {
                message: sanitize(data.message, { allowedTags: [], allowedAttributes: {} }),
                username: user.username,
                avatar: user.avatar,
            });
        });
    }
});

async function start() {
    await client.connect();
    server.listen(process.env.PORT);
}

start();
