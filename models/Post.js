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

        try {
            if (!this.errors.length) {
                // Save post into database
                const postsCollection = getCollection("posts");
                return await postsCollection.insertOne(this.data);
            }
        } catch (dbError) {
            console.error("Database error in Post.create:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async reusablePostQuery(uniqueOperations, visitorId) {
        try {
            const postsCollection = getCollection("posts");
            let aggOperations = uniqueOperations.concat([
                {
                    $lookup: {
                        from: "users",
                        localField: "author",
                        foreignField: "_id",
                        as: "authorDocument",
                    },
                },
                {
                    $project: {
                        title: 1,
                        body: 1,
                        createdDate: 1,
                        authorId: "$author",
                        author: { $arrayElemAt: ["$authorDocument", 0] },
                    },
                },
            ]);

            let posts = await postsCollection.aggregate(aggOperations).toArray();

            // Clean up author property in each post object
            posts = posts.map((post) => {
                post.isVisitorOwner = post.authorId.equals(visitorId);

                post.author = {
                    username: post.author.username,
                    avatar: post.author.avatar,
                };

                return post;
            });

            return posts;
        } catch (dbError) {
            console.error("Database error in findSingleById:", dbError);
            throw new Error("Database query failed");
        }
    }

    static async findSingleById(id, visitorId) {
        if (typeof id !== "string" || !ObjectId.isValid(id)) return null;

        try {
            let posts = await this.reusablePostQuery([{ $match: { _id: ObjectId.createFromHexString(id) } }], visitorId);

            return posts[0];
        } catch (dbError) {
            console.error("Database error in findSingleById:", dbError);
            throw new Error("Database query failed");
        }
    }

    static async findByAuthorId(authorId) {
        return await this.reusablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
    }
}

export default Post;
