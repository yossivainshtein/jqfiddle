isArray = function(a) {
    return (!!a) && (a.constructor === Array);
}

createElement = function (type, className) {
    let e = document.createElement(type);
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

let selectedPaths = new Set();

toggleHeirarchy = function(heirarchy) {
    return function() {
        if (selectedPaths.has(heirarchy)) {
            selectedPaths.delete(heirarchy);
        } else {
            selectedPaths.add(heirarchy);
        }

        let str = calculateJQLine(selectedPaths);
        document.getElementById("result-line").innerText = 'jq ' + str;
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

function createJsonTree(obj, heirarchy) {
    let currentNode;

    if (obj instanceof Object) {
        currentNode = createElement('ul', 'jsonElement');

        for (var property in obj) {                
            if (isArray(obj)) {
                property = Number.parseInt(property);
            }

            let propertyNode = createElement('li', 'jsonProperty');            
            let labelNode = createElement('span', 'jsonLabel');
            labelNode.innerHTML = property.toString();


            heirarchy.push(property);
            let childNodes = createJsonTree(obj[property], heirarchy);
            
            if (obj[property] instanceof Object) {
                let collapseCheckBox = createCheckBox('collapseBox', function () {
                    childNodes.classList.toggle('hidden');
                });
                propertyNode.appendChild(collapseCheckBox);
            }
            propertyNode.appendChild(labelNode);

            if (obj[property] instanceof Object) {
                let currentHeirarcy = heirarchy.slice();
                let selectChechBox = createCheckBox('selectBox', toggleHeirarchy(currentHeirarcy));
                propertyNode.appendChild(selectChechBox);
            }
            propertyNode.appendChild(childNodes);
            currentNode.appendChild(propertyNode); 
            heirarchy.pop();
        }
    } else {
        currentNode = createElement('span', 'jsonValue');
        currentNode.textContent = obj;
        let currentHeirarcy = heirarchy.slice();

        let selectChechBox = createCheckBox('selectBox', toggleHeirarchy(currentHeirarcy));
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
    } catch(err) {
        console.log(err)
    }
}

function sample() {
    document.getElementById("input").innerText = `{
        "quiz": {
            "sport": {
                "q1": {
                    "question": "Which one is correct team name in NBA?",
                    "options": [
                        "New York Bulls",
                        "Los Angeles Kings",
                        "Golden State Warriros",
                        "Huston Rocket"
                    ],
                    "answer": "Huston Rocket"
                }
            },
            "maths": {
                "q1": {
                    "question": "5 + 7 = ?",
                    "options": [
                        "10",
                        "11",
                        "12",
                        "13"
                    ],
                    "answer": "12"
                },
                "q2": {
                    "question": "12 - 8 = ?",
                    "options": [
                        "1",
                        "2",
                        "3",
                        "4"
                    ],
                    "answer": "4"
                }
            }
        }
    }
    
      `.trim()
}