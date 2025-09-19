import validator from "validator";
import bcrypt from "bcryptjs";
import md5 from "md5";
import { getCollection } from "../db.js";

class User {
    constructor(data) {
        this.data = data;
        this.errors = [];
    }

    cleanUp() {
        if (typeof this.data.username != "string") this.data.username = "";
        if (typeof this.data.email != "string") this.data.email = "";
        if (typeof this.data.password != "string") this.data.password = "";

        // Get rid of any bogus properties
        this.data = {
            username: this.data.username.trim().toLowerCase(),
            email: this.data.email.trim().toLowerCase(),
            password: this.data.password,
        };
    }

    async validate() {
        if (this.data.username == "") this.errors.push("You must provide a username.");
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) this.errors.push("Username can only contain letters and numbers.");
        if (!validator.isEmail(this.data.email)) this.errors.push("You must provide a valid email address.");
        if (this.data.password == "") this.errors.push("You must provide a password.");
        if (this.data.password.length > 0 && this.data.password.length < 12) this.errors.push("Password must be at least 12 characters.");
        if (this.data.password.length > 50) this.errors.push("Password cannot exceed 50 characters.");
        if (this.data.username.length > 0 && this.data.username.length < 3) this.errors.push("Username must be at least 3 characters.");
        if (this.data.username.length > 30) this.errors.push("Username cannot exceed 30 characters.");

        // Only if username is valid then check if it's already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await getCollection("users").findOne({ username: this.data.username });
            if (usernameExists) this.errors.push("That username is already taken.");
        }

        // Only if email is valid then check if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await getCollection("users").findOne({ email: this.data.email });
            if (emailExists) this.errors.push("That email is already being used.");
        }
    }

    async login() {
        this.cleanUp();

        const usersCollection = getCollection("users");
        const attemptedUser = await usersCollection.findOne({ username: this.data.username });
        if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
            this.data = attemptedUser;
            return this.data;
        } else {
            throw new Error("Invalid username / password.");
        }
    }

    async register() {
        // Validate user data
        this.cleanUp();
        await this.validate();

        // Only if there are no validation errors
        // then save user data into database
        if (!this.errors.length) {
            const usersCollection = getCollection("users");
            // hash user password
            const salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt);
            this.data.avatar = this.getAvatar();
            return await usersCollection.insertOne(this.data);
        } else {
            throw this.errors;
        }
    }

    getAvatar() {
        return `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`;
    }

    static async findByUsername(username) {
        try {
            if (typeof username !== "string") return null;

            const usersCollection = getCollection("users");
            let user = await usersCollection.findOne({ username: username });
            if (!user) return null;

            return user;
        } catch (dbError) {
            console.error("Database error in User.findByUsername:", dbError);
            throw new Error("Database operation failed");
        }
    }
}

export default User;
