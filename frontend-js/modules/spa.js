async function spaCreatePost(data, e) {
    const response = await fetch(e.target.action, {
        method: "POST",
        body: data,
    });

    const serverInfo = await response.text();
    const ourParser = new DOMParser();
    const ourDoc = ourParser.parseFromString(serverInfo, "text/html");
    document.title = ourDoc.title;
    document.querySelector(".container--narrow").innerHTML = ourDoc.querySelector(".container--narrow").innerHTML;

    const newId = ourDoc.querySelector("#post-id").dataset.id;
    const newPostPath = `/post/${newId}`;
    history.pushState(newPostPath, null, newPostPath);
    $('[data-toggle="tooltip"]').tooltip();
}

async function spaEditPost(data, e) {
    const response = await fetch(e.target.action, {
        method: "POST",
        body: data,
    });

    const serverInfo = await response.text();
    const ourParser = new DOMParser();
    const ourDoc = ourParser.parseFromString(serverInfo, "text/html");
    document.title = ourDoc.title;
    document.querySelector(".container--narrow").innerHTML = ourDoc.querySelector(".container--narrow").innerHTML;
    $('[data-toggle="tooltip"]').tooltip();
}

async function spaDeletePost(data, e) {
    const response = await fetch(e.target.action, {
        method: "POST",
        body: data,
    });

    const serverInfo = await response.text();
    const ourParser = new DOMParser();
    const ourDoc = ourParser.parseFromString(serverInfo, "text/html");

    const nextURL = document.querySelector("#user-link").href;
    history.pushState(nextURL, null, nextURL);

    document.title = ourDoc.title;
    document.querySelector(".container--narrow").innerHTML = ourDoc.querySelector(".container--narrow").innerHTML;
    $('[data-toggle="tooltip"]').tooltip();
}

async function navigateTo(desiredURL) {
    const ourPromise = await fetch(desiredURL);
    const ourData = await ourPromise.text();
    const ourParser = new DOMParser();
    const ourDoc = ourParser.parseFromString(ourData, "text/html");
    document.title = ourDoc.title;
    document.querySelector(".container--narrow").innerHTML = ourDoc.querySelector(".container--narrow").innerHTML;
    $('[data-toggle="tooltip"]').tooltip();
}

function isSameOrigin(a, b) {
    const urlA = new URL(a);
    const urlB = new URL(b);
    return urlA.origin === urlB.origin;
}

export default function () {
    document.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
            if (isSameOrigin(e.target.href, window.location)) {
                e.preventDefault();

                // Add new url to address bar and browser history
                history.pushState(e.target.href, null, e.target.href);

                navigateTo(e.target.href);
            }
        }
    });

    // Listen for when user clicks browser back or forward buttons
    window.addEventListener("popstate", function (e) {
        const targetURL = e.state || this.window.location.href;
        navigateTo(targetURL);
    });

    // SPA for form submit
    document.addEventListener("submit", function (e) {
        if (e.target.classList.contains("spa-form")) {
            e.preventDefault();
            // Get the form field data ready
            const formData = new FormData(e.target);
            const data = new URLSearchParams();
            for (const pair of formData) {
                data.append(pair[0], pair[1]);
            }

            // Create post form
            if (e.target.classList.contains("create-post-form")) {
                spaCreatePost(data, e);
            }
            // Edit existing post form
            if (e.target.classList.contains("edit-post-form")) {
                spaEditPost(data, e);
            }

            // Delete post form
            if (e.target.classList.contains("delete-post-form")) {
                spaDeletePost(data, e);
            }
        }
    });
}
