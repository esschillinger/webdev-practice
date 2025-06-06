const body = document.querySelector("body");
const contextMenu = document.getElementById("context-menu");


function enforceMinDetailsWidth(menu) {
    const details = [...menu.querySelectorAll(".row-action > .additional-details")];
    let maxWidth = 0;

    menu.showPopover();

    details.forEach(d => {
        maxWidth = Math.max(maxWidth, d.getBoundingClientRect().width);
    });

    menu.hidePopover();

    const standaloneActions = [...menu.querySelectorAll(".row-action:not(:has(> .additional-details))")];

    standaloneActions.forEach(a => {
        a.style.paddingRight = `${maxWidth + 5 + 16}px`; // padding (5px) + gap (1rem)
    });
}


function showMainContextMenu(e) {
    if (document.activeElement === contextMenu || contextMenu.contains(document.activeElement)) return;

    e.preventDefault();
    contextMenu.showPopover();

    const boundingRect = contextMenu.getBoundingClientRect();

    let horizontalPlacement = "right";

    if (e.clientX + boundingRect.width > window.innerWidth) {
        contextMenu.style.left = `${e.clientX - boundingRect.width}px`;
        horizontalPlacement = "left";
    }
    else contextMenu.style.left = `${e.clientX}px`;

    if (e.clientY + boundingRect.height > window.innerHeight) contextMenu.style.top = `${e.clientY - boundingRect.height}px`;
    else contextMenu.style.top = `${e.clientY}px`;

    const nestedPopovers = [...contextMenu.querySelectorAll(".context-menu")];

    nestedPopovers.forEach(p => {
        let ancestorPopover = p;

        while (!ancestorPopover.classList.contains("context-menu")) ancestorPopover = ancestorPopover.parentElement;

        ancestorPopover.showPopover();

        const containingBlock = p.parentElement;
        const subBoundingRect = containingBlock.getBoundingClientRect();
        const thisBoundingRect = p.getBoundingClientRect();

        if (horizontalPlacement == "right") p.style.left = `${subBoundingRect.right}px`;
        else p.style.left = `${subBoundingRect.left - thisBoundingRect.width}px`;

        p.style.top = `${subBoundingRect.top}px`;
    });

    nestedPopovers.forEach(p => {
        p.hidePopover();
    });
}


function initialize() {
    body.addEventListener("contextmenu", showMainContextMenu);

    const popovers = [...document.querySelectorAll(".context-menu")];

    popovers.forEach(p => {
        enforceMinDetailsWidth(p);

        if (p === contextMenu) return;

        const popoverWrapper = p.parentElement;

        popoverWrapper.addEventListener("mouseenter", () => {
            p.showPopover();
        });
        
        popoverWrapper.addEventListener("mouseleave", () => {
            p.hidePopover();
        });

        popoverWrapper.addEventListener("focusin", () => {
            p.showPopover();
        })
    });

    const contextMenuButtons = [...contextMenu.querySelectorAll("button")];

    contextMenuButtons.forEach(button => {
        button.addEventListener("click", () => {
            popovers.forEach(p => {
                p.hidePopover();
            })
        });
    });
}


initialize();