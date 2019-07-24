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

class TreeNode {
    constructor() {
        this.children = {};
        this.isSelected = false;
        this.isArray = false;
    }
    
    toggle(path) {
        if (path.length === 0) {
            if (this.isSelected) { // this is delete, we are at final node {
                this.isSelected = false;
                return (Object.keys(this.children).length === 0)
            } else { // this is add, we are at node to add
                this.isSelected = true;
                return false;
            }
        } else {
            const rootVal = path[0];
            if (!this.children[rootVal]) { // this is addition, add new child node
                if (typeof(rootVal) === 'number') { // only arrays have numbers as keys, objects keys will ALWAYS be strings
                    this.isArray = true;
                }

                this.children[rootVal] = new TreeNode();
            }
            const canDelete = this.children[rootVal].toggle(path.slice(1))
            if (canDelete) {
                delete this.children[rootVal]
                return (Object.keys(this.children).length === 0)
            }
            return false;
        }
    }

    getJqLine() {
        var line = '';
        const degree =  Object.keys(this.children).length;
        if (degree === 0) {
            return  '';
        }

        if (degree > 1) {
            line += '|';
        }
        if (this.isSelected) {
            line += '., ';
        }

        var isFirst = true;
        for (var key in this.children) {
            const subline = escapeValueForJq(key, this.isArray) + this.children[key].getJqLine();    ;
            if (degree === 1) {
                 line += subline;
            }  else {
                if (!isFirst) {
                    line += ', '
                }
                line += `(${subline})`
            }
            isFirst = false;
        }

        return  line;
    }
}

function escapeValueForJq(value, isArray) {
    if (isArray) {
        return `[${value}]`;
    } else if (value.match(/.*[^a-zA-Z0-9].*/g)) {
        return `."${value}"`;
    } else {
        return `.${value}`;
    }
    return res;
}
class Tree {
    constructor(isArray) {
        this.root = new TreeNode(isArray);
    }

    toggle(path) {
        this.root.toggle(path);
    }
    add(path) {
        this.root.add(path);
    }

    clear() {
        this.root.children = {};
    }

    getJqLine() {
        let line = this.root.getJqLine();
        return `jq '${line}'`;
    }
}

let selectedPaths_old = new Set();

toggleHeirarchy = function(heirarchy) {
    return function() {
        selectedPaths.toggle(heirarchy);

        let str = selectedPaths.getJqLine();
        document.getElementById("result-line").innerText = str;
    }
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

            current_heirarchy.push(property);
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

let selectedPaths;

function parseJson() {
    let text = document.getElementById("input").value  
    try {
        let obj = JSON.parse(text)
        let objectElement = createJsonTree(obj, [])

        let root = document.getElementById("tree-container")
        root.innerHTML = ''
        root.appendChild(objectElement)
        
        selectedPaths = new Tree(isArray(obj));

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

function openJqPlay() {
    const json = document.getElementById('input').value;
    const jqline = document.getElementById('result-line').innerText;
    const filter = jqline.substring(4, jqline.length - 1);

    const url = "https://jqplay.org/s";
    fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            "j": json,
            "o": [{name: "slurp", enabled: false},
                  {name: "null-input", enabled: false},
                  {name: "compact-output", enabled: false},
                  {name: "raw-input", enabled: false},
                  {name: "raw-output", enabled: false}],
            "q": filter
        }),
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'omit', // include, *same-origin, omit
        headers: {
            // 'Content-Type': 'application/json',
            // 'Accept': 'application/json, text/plain, */*'
        },
        responseType:'text/plain',
        // dataType:'json',
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        mode:'no-cors'
     })
     .then(data => { 
         console.log(1, data)
         return data.json(); }, 
         err => {
            console.log(2, err)
         })
     .then(res => {
        console.log('RESPONSE ', res);
        jqplayUrl = "https://jqplay.org/s/" + res;
        // winådow.open(jqplayUrl, '_blank');
        },  err => {
        console.log(4, err)
    })

    console.log(json, jqline, filter);
}