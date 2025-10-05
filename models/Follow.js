import { ObjectId } from "mongodb";
import { getCollection } from "../db.js";

class Follow {
    constructor(followedUsername, authorId) {
        this.followedUsername = followedUsername;
        this.authorId = authorId;
        this.errors = [];
    }

    cleanUp() {
        if (typeof this.followedUsername !== "string") {
            this.followedUsername = "";
        }
    }

    async validate() {
        // followedUsername must exist in database
        const usersCollection = getCollection("users");
        const followedAccount = await usersCollection.findOne({ username: this.followedUsername });

        if (!followedAccount) this.errors.push("You cannot follow a user that does not exist.");

        this.followedId = followedAccount._id;
    }

    async create() {
        try {
            this.cleanUp();
            await this.validate();

            if (this.errors.length) {
                return { status: "validation", errors: this.errors };
            }

            const followsCollection = getCollection("follows");
            const info = await followsCollection.insertOne({ followedId: this.followedId, authorId: ObjectId.createFromHexString(this.authorId) });

            return { status: "success", info: info };
        } catch (dbError) {
            console.error("Database error in Follow.create:", dbError);
            throw new Error("Database operation failed");
        }
    }
}

export default Follow;
