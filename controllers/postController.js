import Post from "../models/Post.js";

export function viewCreateScreen(req, res) {
    res.render("create-post");
}

export async function create(req, res) {
    try {
        const post = new Post(req.body, req.session.user._id);
        const dbPost = await post.create();

        if (dbPost) {
            res.send("New post created.");
        }
    } catch (error) {
        console.error("Unexpected error in create:", error);
        res.send(error);
    }
}

export async function viewSingle(req, res) {
    try {
        const dbPost = await Post.findSingleById(req.params.id);

        if (!dbPost) {
            return res.status(404).render("404");
        }

        res.render("single-post-screen", { post: dbPost });
    } catch (error) {
        console.error("Error in viewSingle:", error);
        res.status(500).render("500");
    }
}
