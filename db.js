import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

export const client = new MongoClient(process.env.CONNECTIONSTRING);

export async function getCollection(name) {
    const db = client.db(process.env.DB_NAME);
    return db.collection(name);
}
