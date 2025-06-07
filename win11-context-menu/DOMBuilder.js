function create_element(type, attributes = {}) {
    const element = document.createElement(type);
    if (Object.keys(attributes).length === 0) return element;

    if ("id" in attributes) element.id = attributes.id;
    if ("href" in attributes) element.href = attributes.href;
    if ("src" in attributes) element.src = attributes.src;
    if ("controls" in attributes) element.controls = true;
    if ("type" in attributes) element.type = attributes.type;
    if ("alt" in attributes) element.alt = attributes.alt;
    if ("classes" in attributes) { attributes.classes.forEach(cls => { element.classList.add(cls); }); }
    if ("value" in attributes) element.value = attributes.value;
    if ("minlength" in attributes) element.minLength = attributes.minlength;
    if ("maxlength" in attributes) element.maxLength = attributes.maxlength;
    if ("title" in attributes) element.title = attributes.title;
    if ("contenteditable" in attributes) element.contentEditable = true;
    if ("spellcheck" in attributes) element.spellcheck = attributes.spellcheck;
    if ("draggable" in attributes) element.draggable = attributes.draggable;
    if ("popover" in attributes) element.popover = "";
    if ("popovertarget" in attributes) element.popoverTargetElement = attributes.popovertarget;
    if ("tabindex" in attributes) element.tabIndex = attributes.tabindex;
    if ("placeholder" in attributes) element.placeholder = attributes.placeholder;
    if ("text" in attributes) element.textContent = attributes.text;
    if ("dataset" in attributes) {
        for (const [attr, value] of Object.entries(attributes.dataset)) {
            element.dataset[attr] = value;
        }
    }

    return element;
}


// icon, button = true, title = "", description = "", modifiers = []
function create_icon(options, returnIcon = false) {
    const attributes = {
        button : true,
        title : "",
        description : "",
        modifiers : [],
        iconModifiers : [],
        ...options
    };

    let type;
    let wrapper_attributes = { classes : ["icon-wrapper"].concat(attributes.modifiers) };

    if (attributes.button) {
        type = "button";
        wrapper_attributes.title = attributes.title;

        if ("id" in attributes) wrapper_attributes.id = attributes.id;
        if ("popovertarget" in attributes) wrapper_attributes.popovertarget = attributes.popovertarget;

    } else type = "div";


    const wrapper = create_element(type, wrapper_attributes);

    const i = create_element("i", { classes : ["icon", `icon__${attributes.icon}`].concat(attributes.iconModifiers) });
    wrapper.appendChild(i);

    if (attributes.description != "") {
        const d = create_element("label", { classes : ["icon__description"] });
        d.textContent = attributes.description;
        wrapper.appendChild(d);
    }

    if (returnIcon) return [wrapper, i]
    else return wrapper
}