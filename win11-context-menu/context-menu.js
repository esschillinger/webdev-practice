export default class ContextMenu {
    #root;
    #container;
    #isSubMenu;

    constructor(options) {
        options = {
            container : document.querySelector("body"),
            isSubMenu : false,
            ...options
        }

        this.#root = create_element("div", {
            classes : ["context-menu"],
            popover : true
        });

        this.#container = options.container;
        this.#isSubMenu = options.isSubMenu;

        options.groups.forEach(group => {
            const section = create_element("div", { classes : [group.type] });
            this.#root.appendChild(section);

            if (group.type == "standard-actions") {
                group.actions.forEach(action => {
                    const button = create_icon({
                        icon : action.icon,
                        title : action.title,
                        modifiers : ["action"]
                    });

                    button.addEventListener("click", action.onclick);

                    section.appendChild(button);
                });
            
            
            } else if (group.type == "action-group") {
                group.actions.forEach(action => {
                    if (action.type == "button") {
                        const button = create_element("button", { classes : ["action", "row-action"] });
                        section.appendChild(button);

                        const iconWrapper = create_icon({
                            button : false,
                            icon : action.icon,
                            description : action.label,
                            modifiers : ["no-background"],
                            iconModifiers : "icon" in action ? [] : ["no-icon"]
                        });

                        button.appendChild(iconWrapper);

                        if ("details" in action) {
                            const details = create_element("span", {
                                classes : ["additional-details"],
                                text : action.details
                            });

                            button.appendChild(details);
                        }

                        button.addEventListener("click", action.onclick);

                    } else if (action.type == "context-menu") {
                        const subMenu = create_element("div", {
                            classes : ["action", "row-action"],
                            tabindex : 0,
                            popovertarget : action.contextMenu
                        });

                        section.appendChild(subMenu);

                        const iconWrapper = create_icon({
                            button : false,
                            icon : action.icon,
                            description : action.label,
                            modifiers : ["no-background"],
                            iconModifiers : "icon" in action ? [] : ["no-icon"]
                        });
                        
                        const details = create_icon({
                            button : false,
                            icon : "right-chevron",
                            modifiers : ["additional-details", "no-background"],
                            iconModifiers : ["small"]
                        });
                        
                        subMenu.appendChild(iconWrapper);
                        subMenu.appendChild(details);
                        subMenu.appendChild(action.contextMenu);

                        subMenu.addEventListener("mouseenter", () => {
                            action.contextMenu.showPopover();
                        });
                        
                        subMenu.addEventListener("mouseleave", () => {
                            action.contextMenu.hidePopover();
                        });

                        subMenu.addEventListener("focusin", () => {
                            action.contextMenu.showPopover();
                        });

                    }
                });
            }
        });
    }
    
    initialize() {
        this.#container.classContext = this;
        this.#container.prepend(this.#root);

        if (!this.#isSubMenu) this.#container.addEventListener("contextmenu", this.#showMainContextMenu);

        this.#enforceMinDetailsWidth(this.#root); //TODO FIX HERE DOWN

        const popovers = [this.#root, ...this.#root.querySelectorAll(".context-menu")];

        const contextMenuButtons = [...this.#root.querySelectorAll("button")];

        contextMenuButtons.forEach(button => {
            button.addEventListener("click", () => {
                popovers.forEach(p => {
                    p.hidePopover();
                })
            });
        });
    }

    getRoot() {
        return this.#root;
    }

    // #convertToSubMenu() {
    //     if (this.#isSubMenu) this.#container.removeEventListener("contextmenu", this.#showMainContextMenu);
    // }

    #enforceMinDetailsWidth(menu) {
        const details = [...menu.querySelectorAll("& > * > .row-action > .additional-details")];
        let maxWidth = 0;

        menu.showPopover();

        details.forEach(d => {
            maxWidth = Math.max(maxWidth, d.getBoundingClientRect().width);
        });

        menu.hidePopover();

        const standaloneActions = [...menu.querySelectorAll("& > * > .row-action:not(:has(> .additional-details))")];

        standaloneActions.forEach(a => {
            a.style.paddingRight = `${maxWidth + 5 + 16}px`; // padding (5px) + gap (1rem)
        });
    }

    #showMainContextMenu(e) {
        if (document.activeElement === this.classContext.#root || this.classContext.#root.contains(document.activeElement)) return;

        e.preventDefault();
        this.classContext.#root.showPopover();

        const boundingRect = this.classContext.#root.getBoundingClientRect();

        let horizontalPlacement = "right";

        if (e.clientX + boundingRect.width > window.innerWidth) {
            this.classContext.#root.style.left = `${e.clientX - boundingRect.width}px`;
            horizontalPlacement = "left";
        }
        else this.classContext.#root.style.left = `${e.clientX}px`;

        if (e.clientY + boundingRect.height > window.innerHeight) this.classContext.#root.style.top = `${e.clientY - boundingRect.height}px`;
        else this.classContext.#root.style.top = `${e.clientY}px`;

        const nestedPopovers = [...this.classContext.#root.querySelectorAll(".context-menu")];

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
};