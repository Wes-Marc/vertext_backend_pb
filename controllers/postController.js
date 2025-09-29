import Post from "../models/Post.js";

export function viewCreateScreen(req, res) {
    res.render("create-post");
}

export async function create(req, res) {
    try {
        const post = new Post(req.body, req.session.user._id);
        const dbPost = await post.create();

        if (dbPost.status === "validation") {
            dbPost.errors.forEach((error) => req.flash("errors", error));
            req.session.save(() => res.redirect("/create-post"));
        }

        req.flash("success", "New post successfully created.");
        req.session.save(() => res.redirect(`/post/${dbPost.postId}`));
    } catch (error) {
        console.error("Unexpected error in create:", error);
        res.send(error);
    }
}

export async function viewSingle(req, res) {
    try {
        const dbPost = await Post.findSingleById(req.params.id, req.visitorId);

        if (!dbPost) {
            return res.status(404).render("404");
        }

        res.render("single-post-screen", { post: dbPost });
    } catch (error) {
        console.error("Error in viewSingle:", error);
        res.status(500).render("500");
    }
}

export async function viewEditScreen(req, res) {
    try {
        const dbPost = await Post.findSingleById(req.params.id, req.visitorId);

        if (!dbPost) {
            return res.status(404).render("404");
        }

        if (dbPost.isVisitorOwner) {
            res.render("edit-post", { post: dbPost });
        } else {
            req.flash("errors", "You do not have permission to perform that action.");
            req.session.save(() => res.redirect("/"));
        }
    } catch (error) {
        console.error("Error in viewEditScreen", error);
        res.status(500).render("500");
    }
}

export async function edit(req, res) {
    try {
        const post = new Post(req.body, req.visitorId, req.params.id);
        const result = await post.update();

        switch (result.status) {
            case "success":
                req.flash("success", "Post successfully updated.");
                req.session.save(() => res.redirect(`/post/${req.params.id}/edit`));
                break;
            case "validation":
                result.errors.forEach((error) => req.flash("errors", error));
                req.session.save(() => res.redirect(`/post/${req.params.id / edit}`));
                break;
            case "forbidden":
                req.flash("errors", "You do not have permission to perform that action.");
                req.session.save(() => res.redirect("/"));
                break;
            case "notfound":
                req.flash("errors", "Post not found.");
                req.session.save(() => res.redirect("/"));
            default:
                req.flash("errors", "Somethig went wrong.");
                req.session.save(() => res.redirect("/"));
                break;
        }
    } catch (error) {
        console.error("Error in edit", error);
        res.status(500).render("500");
    }
}
