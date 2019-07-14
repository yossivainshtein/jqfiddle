isArray = function(a) {
    return (!!a) && (a.constructor === Array);
}

createElement = function (type, className) {
    let e =     document.createElement(type);
    if (className) {
        e.classList.add(className);
    }

    return e;
}

createCheckBox = function (className, clickHandler) {
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

let selectedPaths = new Set();

toggleHeirarchy = function(heirarchy) {
    return function() {
        if (selectedPaths.has(heirarchy)) {
            selectedPaths.delete(heirarchy);
        } else {
            selectedPaths.add(heirarchy);
        }

        let str = calculateJQLine(selectedPaths);
        document.getElementById("result-line").innerText = "jq '" + str + "'";
    }
}

function calculateJQLine(paths) {
    let flat =  calcFlatJQLine(paths);
    let obj = calculateObjectJQLine(paths);
    return obj;
}

function calcFlatJQLine(paths, addNames) {    
    let pathLines = new Set();

    paths.forEach(path => pathLines.add(calcHeirarchyLine(path, addNames)));
    let line = Array.from(pathLines).join(", ");
    return line;
}

function calculateObjectJQLine(paths) {
    let line = '.';
    if (paths.size == 1) {
        return calcFlatJQLine(paths);
    }

    var processedPaths = [];


    for (var path of paths) {
        if (processedPaths.indexOf(path) >= 0) {
            continue;
        }
        var currentElementPaths = [];

        var firstElementPart = calcHeirarchyLine([path[0]]);
        for (var path2 of paths) {
            if (calcHeirarchyLine([path2[0]]) == firstElementPart) {
                currentElementPaths.push(path2.slice(1));
                processedPaths.push(path2);
            }
        } 
        if (currentElementPaths.length > 1) {
            var rest = calculateObjectJQLine(currentElementPaths);
            if (rest.startsWith('{')) {
                line = `${firstElementPart} | ${calculateObjectJQLine(currentElementPaths)}`
            } else {
                line = `${firstElementPart}${calculateObjectJQLine(currentElementPaths)}`
            }
        } else {
            line = `{ ${calcFlatJQLine(paths, true)} }`
            break;
        }
    }

    return line;
}

function calcHeirarchyLine(path, addNames) {
    var line = '';
    for (var element of path) {
        if (typeof(element) == 'number') {
            line = `${line}[]`;
        } else if (element.match(/-/g)) {
            line = `${line}["${element}"]`;
        } else {
            line = `${line}.${element}`;
        }
    }
    if (addNames) {
        line = `${path[path.length-1]}: ${line}`
    }
    return line;
}

function createJsonTree(obj, current_heirarchy) {
    let currentNode;

    if (obj instanceof Object) {
        currentNode = createElement('ul', 'jsonElement');
        currentNode.classList.add('collapse','show')

        for (var property in obj) {                
            if (isArray(obj)) {
                property = Number.parseInt(property);
            }

            let propertyNode = createElement('li', 'jsonProperty');    
            const propertyNodeId = current_heirarchy.join("___")

            // create collapse checkbox
            if (obj[property] instanceof Object) {
                let collapseCheckBox = createCollapseBox(propertyNodeId);
                propertyNode.appendChild(collapseCheckBox);
            }

            // create property label
            let labelNode = createElement('span', 'jsonLabel');
            labelNode.innerText = property.toString();
            propertyNode.appendChild(labelNode);


            // create selection checkbox
            if (obj[property] instanceof Object) {
                let selectChechBox = createCheckBox('selectBox', toggleHeirarchy(current_heirarchy.slice()));
                propertyNode.appendChild(selectChechBox);
            }

            // create sub-tree
            current_heirarchy.push(property);
            let childNode = createJsonTree(obj[property], current_heirarchy);
            childNode.setAttribute("id", propertyNodeId)
            propertyNode.appendChild(childNode);
            current_heirarchy.pop();

            // attach property to main node
            currentNode.appendChild(propertyNode); 
        }
    } else {
        currentNode = createElement('span', 'jsonValue');
        currentNode.textContent = obj;
        let selectChechBox = createCheckBox('selectBox', toggleHeirarchy(current_heirarchy.slice()));
        currentNode.appendChild(selectChechBox);
    }

    return currentNode;
}

function parseJson() {
    let text = document.getElementById("input").value  
    try {
        let obj = JSON.parse(text)
        let objectElement = createJsonTree(obj, [])

        selectedPaths.clear()
        let root = document.getElementById("tree-container")
        selectedPaths.clear()
        root.innerHTML = ''
        root.appendChild(objectElement)
        
        document.querySelector('#tree-container').scrollIntoView({ 
            behavior: 'smooth' 
        });
    } catch(err) {
        console.log(err)
    }

}

function sample() {
    obj = {"quiz":{"sport":{"q1":{"question":"Which one is correct team name in NBA?","options":["New York Bulls","Los Angeles Kings","Golden State Warriros","Huston Rocket"],"answer":"Huston Rocket"}},"maths":{"q1":{"question":"5 + 7 = ?","options":["10","11","12","13"],"answer":"12"},"q2":{"question":"12 - 8 = ?","options":["1","2","3","4"],"answer":"4"}}}}
    text = JSON.stringify(obj, null, 2); 
    document.getElementById("input").value = text;
}