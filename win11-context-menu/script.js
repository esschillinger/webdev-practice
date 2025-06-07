import ContextMenu from "./context-menu.js";


const subMenu = new ContextMenu({
    isSubMenu : true,
    groups : [
        {
            type : "action-group",
            actions : [
                {
                    type : "button",
                    label : "Paint"
                },
                {
                    type : "button",
                    icon : "image",
                    label : "Photos"
                },
                {
                    type : "button",
                    label : "Snipping Tool"
                },
                {
                    type : "button",
                    label : "Search the Microsoft Store"
                },
                {
                    type : "button",
                    label : "Choose another app"
                }
            ]
        }
    ]
});

const mainMenu = new ContextMenu({
    container : document.querySelector("body"),
    groups : [
        {
            type : "standard-actions",
            actions : [
                {
                    icon : "scissors",
                    title : "Cut"
                },
                {
                    icon : "copy",
                    title : "Copy"
                },
                {
                    icon : "rename",
                    title : "Rename"
                },
                {
                    icon : "share",
                    title : "Share"
                },
                {
                    icon : "delete",
                    title : "Delete"
                },
            ]
        },
        {
            type : "action-group",
            actions : [
                {
                    type : "button",
                    icon : "image",
                    label : "Open",
                    details : "Enter",
                    onclick : () => { console.log("hello!"); }
                },
                {
                    type : "context-menu",
                    icon : "list",
                    label : "Open with",
                    contextMenu : subMenu.getRoot()
                },
                {
                    type : "button",
                    icon : "phone",
                    label : "Send to my phone"
                },
                {
                    type : "button",
                    icon : "folder",
                    label : "Compress to ZIP file"
                },
                {
                    type : "button",
                    icon : "list",
                    label : "Properties",
                    details : "Alt+Enter"
                }
            ]
        },
        {
            type : "action-group",
            actions : [
                {
                    type : "button",
                    icon : "more-options",
                    label : "Show more options",
                    details : "Shift+F10"
                }
            ]
        }
    ]
});


mainMenu.initialize();


/*
const contextMenuRootElement = buildContextMenu({
    container : HTMLElement,
    groups: [
        {
            type : "standard-actions",
            actions : [
                {
                    icon : str,
                    title : str,
                    onclick : function
                }
            ]
        },
        {
            type: "action-group",
            actions : [
                {
                    type : "button" | "context-menu",
                    icon : str,
                    label : str,
                    details : str?,
                    contextMenu : HTMLElement?
                }
            ]
        }
    ]
});
*/