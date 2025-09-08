import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const client = new MongoClient(process.env.CONNECTIONSTRING);
let db;

export async function connectDB() {
    if (!db) {
        await client.connect();
        db = client.db();
    }
    return db;
}
