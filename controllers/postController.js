import Post from "../models/Post.js";

export function viewCreateScreen(req, res) {
    res.render("create-post");
}

export async function create(req, res) {
    const post = new Post(req.body, req.session.user._id);
    try {
        const dbPost = await post.create();
        res.send("New post created.");
    } catch (error) {
        res.send(error);
    }
}
