import express from "express";
import { connectDB } from "./db.js";
import router from "./router.js";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static("public"));
app.set("views", "views");
app.set("view engine", "ejs");

app.use("/", router);

async function start() {
    await connectDB();
    app.listen(process.env.PORT);
}

start();
