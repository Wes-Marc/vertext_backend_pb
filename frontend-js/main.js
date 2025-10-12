import Search from "./modules/search.js";
import Chat from "./modules/chat.js";
import RegistrationForm from "./modules/registrationForm.js";
import Spa from "./modules/spa.js";

if (document.querySelector("#chat-wrapper")) {
    new Chat();
    Spa();
}

if (document.querySelector(".header-search-icon")) {
    new Search();
}

if (document.querySelector("#registration-form")) {
    new RegistrationForm();
}
