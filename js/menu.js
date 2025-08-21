const hamburgerButton = document.querySelector("#hamburgerButton");
const hamburgerIcon = document.querySelector("#hamburgerIcon");
const nav = document.querySelector("#nav");

window.onload = function() {
    hamburgerButton.classList.add("open");
    hamburgerIcon.classList.add("open");
    nav.classList.add("nav-open");
}

hamburgerButton.onclick = function() {
    hamburgerButton.classList.toggle("open");
    hamburgerIcon.classList.toggle("open");
    nav.classList.toggle("nav-open");
}

// Listen to the doc click
window.addEventListener('click', function (e) {
    if (e.target.closest('#sidebar') === null) {
        hamburgerButton.classList.remove("open");
        hamburgerIcon.classList.remove("open");
        nav.classList.remove("nav-open");
    }
});

window.addEventListener('touchstart', function (e) {
    if (e.target.closest('#sidebar') === null) {
        hamburgerButton.classList.remove("open");
        hamburgerIcon.classList.remove("open");
        nav.classList.remove("nav-open");
    }
});