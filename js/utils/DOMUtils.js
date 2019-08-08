function createCheckBox(className, clickHandler) {
    let cb = createElement('input', className);
    cb.type = 'checkbox';

    if (clickHandler) {
        cb.onclick = clickHandler;
    }

    return cb;
}

function createCollapseBox(child_id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 292.362 292.362');
    svg.classList.add('chevron')
    svg.classList.add('show')

    svg.setAttribute("data-toggle", "collapse");
    svg.setAttribute("href", "#"+child_id);
    svg.setAttribute("aria-expanded", "false");
    svg.addEventListener("click", function() {
        svg.classList.toggle('chevron-closed');
    })
    use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#triangle');

    svg.appendChild(use);

    return svg;
}

function createElement(type, className) {
    let e = document.createElement(type);
    if (className) {
        e.classList.add(className);
    }

    return e;
}

function removeAllChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

function createDropdown(options, onChangeHandler){
    select = createElement('select', 'dropdown');
    for (var option of options) {
        let optionElement = createElement('option');
        optionElement.innerText = option;
        select.appendChild(optionElement);
    }

    if (onChangeHandler) {
        select.addEventListener('change', function() {
            selectedValue = select.options[select.selectedIndex].value;
            onChangeHandler(selectedValue);
        })
    }
    return select;
}