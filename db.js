const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");
dotenv.config();

const client = new MongoClient(process.env.CONNECTIONSTRING);

async function start() {
    await client.connect();
    module.exports = client.db();
    const app = require("./app");
    app.listen(process.env.PORT);
}

start();
