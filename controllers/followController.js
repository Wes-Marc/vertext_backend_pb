import Follow from "../models/Follow.js";

export async function addFollow(req, res) {
    try {
        const follow = new Follow(req.params.username, req.visitorId);
        const result = await follow.create();

        if (result.status === "validation") {
            result.errors.forEach((error) => {
                req.flash("errors", error);
                req.session.save(() => res.redirect("/"));
            });
        }

        req.flash("success", `Successfully followed ${req.params.username}`);
        req.session.save(() => res.redirect(`/profile/${req.params.username}`));
    } catch (error) {
        console.error("Error in addFollow", error);
        res.status(500).render("500");
    }
}
