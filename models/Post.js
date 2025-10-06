import { getCollection } from "../db.js";
import { ObjectId } from "mongodb";
import sanitize from "sanitize-html";

class Post {
    constructor(data, userId, requestedPostId) {
        this.data = data;
        this.errors = [];
        this.userId = userId;
        this.requestedPostId = requestedPostId;
    }

    cleanUp() {
        if (typeof this.data.title !== "string") this.data.title = "";
        if (typeof this.data.body !== "string") this.data.body = "";

        // Get rid of any bogus properties
        this.data = {
            title: sanitize(this.data.title.trim(), { allowedTags: [], allowedAttributes: {} }),
            body: sanitize(this.data.body.trim(), { allowedTags: [], allowedAttributes: {} }),
            createdDate: new Date(),
            author: ObjectId.createFromHexString(this.userId),
        };
    }

    validate() {
        if (this.data.title === "") this.errors.push("You must provide a title.");
        if (this.data.body === "") this.errors.push("You must provide post content.");
    }

    async create() {
        try {
            this.cleanUp();
            this.validate();

            if (this.errors.length) {
                return { status: "validation", errors: this.errors };
            }

            // Save post into database
            const postsCollection = getCollection("posts");
            const info = await postsCollection.insertOne(this.data);

            return { status: "success", postId: info.insertedId };
        } catch (dbError) {
            console.error("Database error in Post.create:", dbError);
            throw new Error("Database operation failed");
        }
    }

    async update() {
        try {
            const post = await Post.findSingleById(this.requestedPostId, this.userId);

            if (!post) {
                return { status: "notfound" }; // post doesn't exist
            }

            if (!post.isVisitorOwner) {
                return { status: "forbidden" }; // user is not the owner
            }

            this.cleanUp();
            this.validate();

            if (this.errors.length) {
                return { status: "validation", errors: this.errors };
            }

            // Update post
            const postsCollection = getCollection("posts");
            await postsCollection.findOneAndUpdate(
                { _id: ObjectId.createFromHexString(this.requestedPostId) },
                {
                    $set: {
                        title: this.data.title,
                        body: this.data.body,
                    },
                }
            );

            return { status: "success" };
        } catch (dbError) {
            console.error("Database error in Post.update:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async delete(postIdToDelete, currentUserId) {
        try {
            const post = await Post.findSingleById(postIdToDelete, currentUserId);

            if (!post) {
                return { status: "notfound" }; // post doesn't exist
            }

            if (!post.isVisitorOwner) {
                return { status: "forbidden" }; // user is not the owner
            }

            // Delete post
            const postsCollection = getCollection("posts");
            await postsCollection.deleteOne({ _id: ObjectId.createFromHexString(postIdToDelete) });

            return { status: "success" };
        } catch (dbError) {
            console.error("Database error in Post.delete:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async search(searchTerm) {
        try {
            if (typeof searchTerm === "string") {
                const posts = await this.reusablePostQuery(
                    [
                        {
                            $match: {
                                $text: {
                                    $search: searchTerm,
                                },
                            },
                        },
                    ],
                    undefined,
                    [
                        {
                            $sort: {
                                score: {
                                    $meta: "textScore",
                                },
                            },
                        },
                    ]
                );

                return posts;
            } else {
                return null;
            }
        } catch (dbError) {
            console.error("Database error in Post.search:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async reusablePostQuery(uniqueOperations, visitorId, finalOperations = []) {
        try {
            const postsCollection = getCollection("posts");
            let aggOperations = uniqueOperations
                .concat([
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
                ])
                .concat(finalOperations);

            let posts = await postsCollection.aggregate(aggOperations).toArray();

            // Clean up author property in each post object
            posts = posts.map((post) => {
                post.isVisitorOwner = post.authorId.equals(visitorId);
                post.authorId = undefined;

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
            let posts = await this.reusablePostQuery(
                [{ $match: { _id: ObjectId.createFromHexString(id) } }],
                visitorId
            );

            return posts[0];
        } catch (dbError) {
            console.error("Database error in findSingleById:", dbError);
            throw new Error("Database query failed");
        }
    }

    static async findByAuthorId(authorId) {
        return await this.reusablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
    }

    static async countPostsByAuthor(id) {
        try {
            const postsCollection = getCollection("posts");
            const postCount = await postsCollection.countDocuments({ author: id });

            return postCount;
        } catch (dbError) {
            console.error("Database error in countPostsByAuthor:", dbError);
            throw new Error("Database query failed");
        }
    }
}

export default Post;
