function isArray(a) {
    return (!!a) && (a.constructor === Array);
}

function getType(obj) {
    return isArray(obj) ? 'Array' : typeof(obj);
}

class TreeNode {
    constructor(type) {
        this.children = {};
        this.isSelected = false;
        this.type = type;
        this.controlNode = document.createElement('span');
    }
    
    _refreshControlNode() {
        removeAllChildren(this.controlNode);
        switch(this.type) {
            case 'Array':
                let node = this;
                const arrayDropdown = createDropdown(['Only selected', 'All', 'Range'], (selectedValue) => { node.agg = selectedValue; refreshJQLine(); } )
                this.controlNode.append(arrayDropdown);
                //  break;
            case 'object':
                if (Object.keys(this.children).length > 1) {
                    const aggregationDropDown = createDropdown(['No aggregation', 'Array', 'Object']);
                    this.controlNode.append(aggregationDropDown);
                }
                break;    
            default:
                // this.controlNode.innerText = this.type;
                break;        
        }
    }

    getSelectionControlNode() {
        return this.controlNode;
    }

    toggle(path, obj) {
        this._toggle(path, 0, obj);
    }

    _toggle(path, loc, obj) {
        let canDelete;
        if (path.length === loc) {
            this.isSelected = !this.isSelected;
            canDelete = !this.isSelected;
        } else {
            const next_child = path[loc];
            if (!this.children[next_child]) { // this is addition, add new child node                
                const elementTreeNode = new TreeNode(getType(obj[next_child]));
                this.children[next_child] = elementTreeNode;

                selectionState.getSelectionControl(path.slice(0, loc + 1)).appendChild(elementTreeNode.getSelectionControlNode());
            }
            canDelete = this.children[next_child]._toggle(path, loc + 1, obj[next_child])
            if (canDelete) {
                delete this.children[next_child]
                removeAllChildren(selectionState.getSelectionControl(path.slice(0, loc + 1)))
                // return (Object.keys(this.children).length === 0)
            }
        }
        this._refreshControlNode()
        return canDelete && Object.keys(this.children).length === 0;
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
            if (this.agg === 'All') {
                line += `[]` + this.children[key].getJqLine();
                break;
            }
            const subline = escapeValueForJq(key, this.type) + this.children[key].getJqLine();
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

function escapeValueForJq(value, type) {
    if (type === 'Array') {
        return `[${value}]`;
    } else if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(value)) {
        return `.${value}`;
    } else {
        return `."${value}"`;
    }
    return res;
}
class Tree {
    constructor(obj) {
        this.root = new TreeNode(getType(obj));
        this.obj = obj;
    }

    toggle(path) {
        this.root.toggle(path, this.obj);
    }

    getJqLine() {
        let line = this.root.getJqLine();
        return `jq '${line}'`;
    }
}

function get_heirarchy_id(heirarchy) {
    return heirarchy.join("___")
}

class SelectionState {
    constructor(obj) {
        this.selectionTree = new Tree(obj);
        this.selectionControlElements = {}
    }

    toggleHeirarchy(heirarchy) {
        const state = this;
        return function() {
            state.selectionTree.toggle(heirarchy);
            refreshJQLine();
        }
    }

    registerSelectionControl(heirarchy, element) {
        this.selectionControlElements[get_heirarchy_id(heirarchy)] = element;
    }

    getSelectionControl(heirarchy) {
        return this.selectionControlElements[get_heirarchy_id(heirarchy)]
    }


}

function refreshJQLine() {
    let str = selectionState.selectionTree.getJqLine();
    document.getElementById("result-line").innerText = str;
}

function createJsonTree(obj, current_heirarchy) {
    let currentNode;

    if (obj instanceof Object) {
        currentNode = createElement('ul', 'jsonElement');
        currentNode.classList.add('collapse','show')

        for (var property in obj) {                
            if (isArray(obj)) { // TODO: really needed????
                property = Number.parseInt(property);
            }

            current_heirarchy.push(property);
            let propertyNode = createElement('li', 'jsonProperty');    
            currentNode.appendChild(propertyNode); 
            const propertyNodeId = get_heirarchy_id(current_heirarchy)

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
                let selectChechBox = createCheckBox('selectBox', selectionState.toggleHeirarchy(current_heirarchy.slice()));
                propertyNode.appendChild(selectChechBox);

                // add element to place selection control
                const selectionContol = createElement('span', 'selectionControl');
                propertyNode.appendChild(selectionContol);
                selectionState.registerSelectionControl(current_heirarchy, selectionContol);    
            }

        
            // create sub-tree
            let childNode = createJsonTree(obj[property], current_heirarchy);
            childNode.setAttribute("id", propertyNodeId)
            propertyNode.appendChild(childNode);
            current_heirarchy.pop();
        }
    } else {
        currentNode = createElement('span', 'jsonValue');
        currentNode.textContent = obj;
        let selectChechBox = createCheckBox('selectBox', selectionState.toggleHeirarchy(current_heirarchy.slice()));
        currentNode.appendChild(selectChechBox);

        // add element to place selection control
        const selectionContol = createElement('span', 'selectionControl');
        currentNode.appendChild(selectionContol);
        selectionState.registerSelectionControl(current_heirarchy, selectionContol);    
    }

    return currentNode;
}

let selectionState;

function parseJson() {
    const inputElement = document.getElementById("input");
    const treeContainerElement = document.getElementById("tree-container");

    let json = inputElement.value
    let obj;
    try {        
        obj = JSON.parse(json);
    } catch(err) {
        inputElement.setCustomValidity('error'); // set error border
        $("#input").tooltip({ boundary: 'window', trigger: 'manual'})
                   .attr('data-original-title', err.message)
                   .tooltip('show');
        return;
    }

    inputElement.setCustomValidity(''); // clear error border
    $("#input").tooltip('hide')

    selectionState = new SelectionState(obj);

    removeAllChildren(treeContainerElement);
    let objectTree = createJsonTree(obj, [])
    treeContainerElement.appendChild(objectTree)
    
    document.querySelector('#tree-container').scrollIntoView({ 
        behavior: 'smooth' 
    });
    

}

var timeoutHandler;
function delayParseJson() {
    if (timeoutHandler) {
        clearTimeout(timeoutHandler)
    }
    timeoutHandler = setTimeout(parseJson, 1000);

}

function sample_quiz() {
    let obj = {"quiz":{"sport":{"q1":{"question":"Which one is correct team name in NBA?","options":["New York Bulls","Los Angeles Kings","Golden State Warriros","Huston Rocket"],"answer":"Huston Rocket"}},"maths":{"q1":{"question":"5 + 7 = ?","options":["10","11","12","13"],"answer":"12"},"q2":{"question":"12 - 8 = ?","options":["1","2","3","4"],"answer":"4"}}}}
    sample(obj);
}

function sample_grades() {
    let obj = {"name":"yossi", "grades":[{"course":"calculus", "grade":85},{"course":"algebra", "grade":70}, {"course":"english", "grade":90}]}
    sample(obj);
}

function sample(obj) {
    text = JSON.stringify(obj, null, 2); 
    document.getElementById("input").value = text;
    delayParseJson()
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

