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

    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.showPopover();

    const nestedPopovers = [...contextMenu.querySelectorAll(".context-menu")];

    nestedPopovers.forEach(p => {
        let ancestorPopover = p;

        while (!ancestorPopover.classList.contains("context-menu")) ancestorPopover = ancestorPopover.parentElement;

        ancestorPopover.showPopover();

        const containingBlock = p.parentElement;
        const boundingRect = containingBlock.getBoundingClientRect();

        p.style.left = `${boundingRect.right}px`;
        p.style.top = `${boundingRect.top}px`;
        
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