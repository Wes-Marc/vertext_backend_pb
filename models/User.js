import validator from "validator";
import bcrypt from "bcryptjs";
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
            password: this.data.password
        };
    }

    validate() {
        if (this.data.username == "") this.errors.push("You must provide a username.");
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) this.errors.push("Username can only contain letters and numbers.");
        if (!validator.isEmail(this.data.email)) this.errors.push("You must provide a valid email address.");
        if (this.data.password == "") this.errors.push("You must provide a password.");
        if (this.data.password.length > 0 && this.data.password.length < 12) this.errors.push("Password must be at least 12 characters.");
        if (this.data.password.length > 50) this.errors.push("Password cannot exceed 50 characters.");
        if (this.data.username.length > 0 && this.data.username.length < 3) this.errors.push("Username must be at least 3 characters.");
        if (this.data.username.length > 30) this.errors.push("Username cannot exceed 30 characters.");
    }

    async login() {
        this.cleanUp();

        try {
            const usersCollection = await getCollection("users");
            const attemptedUser = await usersCollection.findOne({ username: this.data.username });
            if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                return "Congrats, you dumb fuck.";
            } else {
                return "Invalid username / password.";
            }
        } catch (error) {
            console.log(error);
        }
    }

    async register() {
        // Validate user data
        this.cleanUp();
        this.validate();

        // Only if there are no validation errors
        // then save user data into database
        if (!this.errors.length) {
            const usersCollection = await getCollection("users");
            // hash user password
            const salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt);
            await usersCollection.insertOne(this.data);
        }
    }
}

export default User;
