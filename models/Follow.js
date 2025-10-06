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

    async validate(action) {
        try {
            // followedUsername must exist in database
            const usersCollection = getCollection("users");
            const followedAccount = await usersCollection.findOne({ username: this.followedUsername });

            if (!followedAccount) this.errors.push("You cannot follow a user that does not exist.");

            this.followedId = followedAccount._id;

            // Follow action logic:
            // If already following, can't follow again.
            // If not following, can't stop following.
            const followsCollection = getCollection("follows");
            let doesFollowAlreadyExist = await followsCollection.findOne({
                followedId: this.followedId,
                authorId: ObjectId.createFromHexString(this.authorId),
            });

            if (action === "create") {
                if (doesFollowAlreadyExist) {
                    this.errors.push("You are already following this user.");
                }
            }

            if (action === "delete") {
                if (!doesFollowAlreadyExist) {
                    this.errors.push("You cannot stop following someone you do not already follow.");
                }
            }

            // Should not be able to follow yourself
            if (this.followedId.equals(this.authorId)) {
                this.errors.push("You cannot follow yourself.");
            }
        } catch (dbError) {
            console.error("Database error in Follow.validate:", dbError);
            throw new Error("Database operation failed");
        }
    }

    async create() {
        try {
            this.cleanUp();
            await this.validate("create");

            if (this.errors.length) {
                return { status: "validation", errors: this.errors };
            }

            const followsCollection = getCollection("follows");
            const info = await followsCollection.insertOne({
                followedId: this.followedId,
                authorId: ObjectId.createFromHexString(this.authorId),
            });

            return { status: "success", info: info };
        } catch (dbError) {
            console.error("Database error in Follow.create:", dbError);
            throw new Error("Database operation failed");
        }
    }

    async delete() {
        try {
            this.cleanUp();
            await this.validate("delete");

            if (this.errors.length) {
                return { status: "validation", errors: this.errors };
            }

            const followsCollection = getCollection("follows");
            const info = await followsCollection.deleteOne({
                followedId: this.followedId,
                authorId: ObjectId.createFromHexString(this.authorId),
            });

            return { status: "success", info: info };
        } catch (dbError) {
            console.error("Database error in Follow.delete:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async isVisitorFollowing(followedId, visitorId) {
        try {
            const followsCollection = getCollection("follows");
            const followDoc = await followsCollection.findOne({
                followedId: followedId,
                authorId: ObjectId.createFromHexString(visitorId),
            });

            if (!followDoc) {
                return false;
            }

            return true;
        } catch (dbError) {
            console.error("Database error in Follow.isVisitorFollowing:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async getFollowersById(id) {
        try {
            const followsCollection = getCollection("follows");
            const followers = await followsCollection
                .aggregate([
                    { $match: { followedId: id } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "authorId",
                            foreignField: "_id",
                            as: "userDoc",
                        },
                    },
                    {
                        $project: {
                            username: { $arrayElemAt: ["$userDoc.username", 0] },
                            avatar: { $arrayElemAt: ["$userDoc.avatar", 0] },
                        },
                    },
                ])
                .toArray();

            return followers;
        } catch (dbError) {
            console.error("Database error in Follow.getFollowersById:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async getFollowingById(id) {
        try {
            const followsCollection = getCollection("follows");
            const following = await followsCollection
                .aggregate([
                    { $match: { authorId: id } },
                    {
                        $lookup: {
                            from: "users",
                            localField: "followedId",
                            foreignField: "_id",
                            as: "userDoc",
                        },
                    },
                    {
                        $project: {
                            username: { $arrayElemAt: ["$userDoc.username", 0] },
                            avatar: { $arrayElemAt: ["$userDoc.avatar", 0] },
                        },
                    },
                ])
                .toArray();

            return following;
        } catch (dbError) {
            console.error("Database error in Follow.getFollowersById:", dbError);
            throw new Error("Database operation failed");
        }
    }

    static async countFollowersById(id) {
        try {
            const followsCollection = getCollection("follows");
            const followerCount = await followsCollection.countDocuments({ followedId: id });

            return followerCount;
        } catch (dbError) {
            console.error("Database error in countPostsByAuthor:", dbError);
            throw new Error("Database query failed");
        }
    }

    static async countFollowingById(id) {
        try {
            const followsCollection = getCollection("follows");
            const followingCount = await followsCollection.countDocuments({ authorId: id });

            return followingCount;
        } catch (dbError) {
            console.error("Database error in countPostsByAuthor:", dbError);
            throw new Error("Database query failed");
        }
    }
}

export default Follow;
