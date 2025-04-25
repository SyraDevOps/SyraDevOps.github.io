function fadeIn(element) {
    element.style.opacity = 0;
    element.style.transition = "opacity 0.5s ease-in";
    element.style.display = "block";

    setTimeout(() => {
        element.style.opacity = 1;
    }, 50);
}

function fadeOut(element) {
    element.style.opacity = 1;
    element.style.transition = "opacity 0.5s ease-out";

    setTimeout(() => {
        element.style.opacity = 0;
        setTimeout(() => {
            element.style.display = "none";
        }, 500);
    }, 50);
}

function slideIn(element) {
    element.style.transform = "translateX(-100%)";
    element.style.transition = "transform 0.5s ease-in";
    element.style.display = "block";

    setTimeout(() => {
        element.style.transform = "translateX(0)";
    }, 50);
}

function slideOut(element) {
    element.style.transform = "translateX(0)";
    element.style.transition = "transform 0.5s ease-out";

    setTimeout(() => {
        element.style.transform = "translateX(-100%)";
        setTimeout(() => {
            element.style.display = "none";
        }, 500);
    }, 50);
}