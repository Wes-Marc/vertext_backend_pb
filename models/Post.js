import { getCollection } from "../db.js";
import { ObjectId } from "mongodb";

class Post {
    constructor(data, userId) {
        this.data = data;
        this.errors = [];
        this.userId = userId;
    }

    cleanUp() {
        if (typeof this.data.title !== "string") this.data.title = "";
        if (typeof this.data.body !== "string") this.data.body = "";

        // Get rid of any bogus properties
        this.data = {
            title: this.data.title.trim(),
            body: this.data.body.trim(),
            createdDate: new Date(),
            author: ObjectId.createFromHexString(this.userId),
        };
    }

    validate() {
        if (this.data.title === "") this.errors.push("You must provide a title.");
        if (this.data.body === "") this.errors.push("You must provide post content.");
    }

    async create() {
        this.cleanUp();
        this.validate();

        if (!this.errors.length) {
            // Save post into database
            const postsCollection = getCollection("posts");
            await postsCollection.insertOne(this.data);
        } else {
            throw this.errors;
        }
    }
}

export default Post;
