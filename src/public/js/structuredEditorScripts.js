

const TUPLE_SELECTOR_TEXT = `Forge expression yielding tuples (arity ≥ 2); constraint applies from first to last element.`;
const UNARY_SELECTOR_TEXT = `Forge expression yielding singletons.`;

const CYCLIC_DESCRIPTION = "Arrange elements along the perimeter of a circle."
const ORIENTATION_DESCRIPTION = "Specify the relative positioning of elements."
const GROUPING_SELECTOR_DESCRIPTION = "Group elements based on a selector."
const GROUPING_FIELD_DESCRIPTION = "Group elements based on a field."


const CONSTRAINT_SELECT = `
        <button class="close" title="Remove constraint" type="button" onclick="removeConstraint(this)">
            <span aria-hidden="true">&times;</span>
        </button>
        <div class="input-group"> 
            <div class="input-group-prepend">
                <span class="input-group-text" title="Choose constraint type">Constraint</span>
            </div>
            <select onchange="updateFields(this)">
                <option value="orientation" title=${ORIENTATION_DESCRIPTION}>Orientation</option>
                <option value="cyclic" title=${CYCLIC_DESCRIPTION}>Cyclic</option>
                <option value="groupfield" title=${GROUPING_FIELD_DESCRIPTION}>Group by field</option>
                <option value="groupselector"  title=${GROUPING_SELECTOR_DESCRIPTION}>Group by selector</option>
            </select>
        </div>
        <div class="params"></div>
    `;

const CYCLIC_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${TUPLE_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text">Direction</span>
    </div>
    <select name="direction">
        <option value="clockwise">Clockwise</option>
        <option value="counterclockwise">Counterclockwise</option>
    </select>
</div>
    `;



const ORIENTATION_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${TUPLE_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text">Directions</span>
    </div>
    <select name="directions" class="form-control" multiple>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="directlyLeft">Directly Left</option>
            <option value="directlyRight">Directly Right</option>
            <option value="directlyAbove">Directly Above</option>
            <option value="directlyBelow">Directly Below</option>
    </select>
</div>       
`;

const GROUP_BY_FIELD_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend"> <span class="input-group-text">Field</span> </div>
    <input type="text" name="field" required>
</div>
<div class="input-group">
    <div class="input-group-prepend"> <span class="input-group-text infolabel" title="Which 0-indexed element of the field to use as the group key."> Group On </span> </div>
    <input type="number" name="groupOn" required>
</div>
<div class="input-group">
    <div class="input-group-prepend"> <span class="input-group-text infolabel" title="Which 0-indexed element of the field are group members."> Add to Group </span> </div>
    <input type="number" name="addToGroup" required>
</div>
`;



const GROUP_BY_SELECTOR_SELECTOR = `

<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${UNARY_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <div class="input-group-prepend">  <span class="input-group-text">Group Name</span> </div>
    <input type="text" name="name" required>
</div>
`;


const DIRECTIVE_SELECT = `
    <button class="close" title="Remove directive" type="button" onclick="removeDirective(this)">
        <span aria-hidden="true">&times;</span>
    </button>
    <div class="input-group">
        <div class="input-group-prepend">
            <span class="input-group-text">Directive</span>
        </div>
        <select onchange="updateFields(this)">
            <option value="attribute">Attribute</option>
            <option value="icon">Icon</option>
            <option value="color">Color</option>
            <option value="size">Size</option>
            <option value="projection">Projection</option>
            <option value="flag">Visibility Flag</option>
        </select>
    </div>
    <div class="params"></div>
`;


const ATTRIBUTE_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend"> <span class="input-group-text">Field</span></div>
    <input type="text" name="field" class="form-control" required>
</div>`;

const PROJECTION_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend"><span class="input-group-text">Sig</span></div>
    <input type="text" class="form-control" name="sig" required>
</div>
`;

const COLOR_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${UNARY_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <div class="input-group-prepend"><span class="input-group-text">Color</span></div>
    <input type="color" name="value" class="form-control" required>
</div>
`;

const ICON_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${UNARY_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <div class="input-group-prepend"><span class="input-group-text">Path</span></div>
    <input type="text" name="path" class="form-control" required placeholder="/path/to/icon.png">
</div>
`;

const SIZE_SELECTOR = `
<div class="input-group">
    <div class="input-group-prepend">
        <span class="input-group-text infolabel" title="${UNARY_SELECTOR_TEXT}">Selector</span>
    </div>
    <input type="text" name="selector" required>
</div>
<div class="input-group">
    <label><span class="input-group-text">Width</span></label> <input type="number" name="width" class="form-control" required>
     <label><span class="input-group-text">Height</span></label> <input type="number" name="height" class="form-control" required>
</div>
`;

const FLAG_SELECTOR = `
<div class="input-group">
    <select name="flag" class="form-control">
        <option value="hideDisconnectedBuiltIns">Hide disconnected built ins.</option>
        <option value="hideDisconnected">Hide all disconnected.</option>
    </select>
</div>
`;

function addConstraint() {
    const container = document.getElementById("constraintContainer"); // Use the div instead of a form
    const div = document.createElement("div");
    div.classList.add("constraint");
    div.innerHTML = CONSTRAINT_SELECT;

    container.appendChild(div);
    updateFields(div.querySelector("select"));
}


function addDirective() {
    const container = document.getElementById("directiveContainer");
    const div = document.createElement("div");
    div.classList.add("directive");
    div.innerHTML = DIRECTIVE_SELECT;

    container.appendChild(div);
    updateFields(div.querySelector("select"));
}


// TODO: This has to change
function updateFields(select) {
    const paramsDiv = select.parentElement.nextElementSibling;
    paramsDiv.innerHTML = "";
    const type = select.value;


    // Constraint Fields
    if (type === "cyclic") {
        paramsDiv.innerHTML = CYCLIC_SELECTOR;
    } else if (type === "orientation") {
        paramsDiv.innerHTML = ORIENTATION_SELECTOR;
    } else if (type === "groupfield") {
        paramsDiv.innerHTML = GROUP_BY_FIELD_SELECTOR;
    } else if (type === "groupselector") {
        paramsDiv.innerHTML = GROUP_BY_SELECTOR_SELECTOR;
    }



    // Directive Fields
    if (type === "attribute") {
        paramsDiv.innerHTML = ATTRIBUTE_SELECTOR;
    } else if (type === "icon") {
        paramsDiv.innerHTML = ICON_SELECTOR;
    } else if (type === "color") {
        paramsDiv.innerHTML = COLOR_SELECTOR;
    } 
    else if (type === "size") { 
        paramsDiv.innerHTML = SIZE_SELECTOR;
    }
    else if (type === "projection") {
        paramsDiv.innerHTML = PROJECTION_SELECTOR;
    } else if (type === "flag") {
        paramsDiv.innerHTML = FLAG_SELECTOR;
    }
}

function removeConstraint(button) {
    button.parentElement.remove();
}

function removeDirective(button) {
    button.parentElement.remove();
}



function toYamlConstraintType(t) {

    if (t === "cyclic") {
        return "cyclic";
    }
    if (t === "orientation") {
        return "orientation";
    }
    if (t === "groupfield" || t === "groupselector") {
        return "group";
    }
    return "unknown";
}

function resolveColorValue(color) {
    const resolvedColor = tinycolor(color); // Use TinyColor to parse the color
    if (resolvedColor.isValid()) {
        return resolvedColor.toHexString(); // Convert to hexadecimal format
    }
    console.warn(`Invalid color: ${color}. Defaulting to black.`);
    return "#000000"; // Default to black if the color is invalid
}

// TODO: Change
function writeToYAMLEditor() {

    const constraints = [];
    const directives = [];


    document.querySelectorAll(".constraint").forEach(div => {
        const type = div.querySelector("select").value;
        const params = {};



        div.querySelectorAll("input, select").forEach(input => {
            if (input.multiple) {
                params[input.name] = Array.from(input.selectedOptions).map(option => option.value);
            } else if (input.name.length > 0) {
                params[input.name] = input.value;
            }
        });

        constraints.push({ [toYamlConstraintType(type)]: params });
    });


    document.querySelectorAll(".directive").forEach(div => {
        const type = div.querySelector("select").value;
        let params = {};
        const isFlag = type === "flag";

        div.querySelectorAll("input, select").forEach(input => {
            let key = input.name;
            let value = input.value;


            if (key.length > 0) {
                if (input.multiple) {
                    params[key] = Array.from(input.selectedOptions).map(option => option.value);
                }
                else if (isFlag) {
                    // HACKY!!!
                    params = value;
                }
                else {
                    params[key] = value;
                }
            }
        });
        directives.push({ [type]: params });

    });


    // Hacky but need to do this for defaults (esp. directives)
    let combinedSpec = {};
    if (constraints.length > 0) {
        combinedSpec.constraints = constraints;
    }
    if (directives.length > 0) {
        combinedSpec.directives = directives;
    }

    let yamlStr = "";

    if (Object.keys(combinedSpec).length > 0) {
        yamlStr = jsyaml.dump(combinedSpec);
    }

    if (window.editor) {
        window.editor.setValue(yamlStr);
    }
    else {
        alert("Window editor not found");
    }
}


function get_constraint_type_from_yaml(constraint) {

    const type = Object.keys(constraint)[0]; // Get the constraint type
    const params = constraint[type]; // Get the parameters for the constraint

    if (type === "cyclic" || type === "orientation") {
        return type;
    }
    if (type === "group") {
        if (params["selector"]) {
            return "groupselector";
        }
        if (params["field"]) {
            return "groupfield";
        }
    }
    return "unknown";
}


// TODO: Change
function populateStructuredEditor() {

    if (!window.editor) {
        alert("Something went wrong. Please refresh the page and try again.");
        return;
    }

    try {
        const yamlContent = window.editor.getValue();
        const parsedYaml = jsyaml.load(yamlContent);

        // Clear the existing constraints in the structured editor
        const constraintContainer = document.getElementById("constraintContainer");
        constraintContainer.innerHTML = "";

        const directiveContainer = document.getElementById("directiveContainer");
        directiveContainer.innerHTML = "";


        const constraints = parsedYaml ? parsedYaml.constraints : [];
        const directives = parsedYaml ? parsedYaml.directives : [];


        // Populate the structured editor with constraints from the YAML
        if (constraints) {
            constraints.forEach(constraint => {

                const type = get_constraint_type_from_yaml(constraint);
                const params = constraint[Object.keys(constraint)[0]];

                // Add a new constraint to the structured editor
                const div = document.createElement("div");
                div.classList.add("constraint");
                div.innerHTML = CONSTRAINT_SELECT;


                let sel = div.querySelector("select");
                sel.value = type;
                constraintContainer.appendChild(div);

                updateFields(sel); // Dynamically generate the fields
                const paramsDiv = div.querySelector(".params");


                // Fill in the values for the generated fields
                Object.keys(params).forEach(key => {
                    let input = paramsDiv.querySelector(`[name="${key}"]`);
                    if (input) {
                        if (input.multiple && Array.isArray(params[key])) {
                            // Handle multi-select fields
                            Array.from(input.options).forEach(option => {
                                option.selected = params[key].includes(option.value);
                            });
                        } else {
                            // Handle single-value fields
                            input.value = params[key];
                        }
                    }

                });
            });
        }


        // Populate the structured editor with directives from the YAML
        if (directives) {
            directives.forEach(directive => {

                const type = Object.keys(directive)[0];
                const params = directive[type];

                // Add a new directive to the structured editor
                const div = document.createElement("div");
                div.classList.add("directive");
                div.innerHTML = DIRECTIVE_SELECT;

                let sel = div.querySelector("select");
                sel.value = type;
                directiveContainer.appendChild(div);

                updateFields(sel); // Dynamically generate the fields
                const paramsDiv = div.querySelector(".params");


                // Check if params is an object or a string

                // This is for simple flag select style scenarios.
                if (typeof params === "string") {
                    let singleInput = paramsDiv.querySelector(`[name="${type}"]`);
                    if (singleInput) {
                        singleInput.value = params;
                    }
                }
                else if (typeof params === "object") {
                    // Fill in the values for the generated fields
                    Object.keys(params).forEach(key => {
                        let input = paramsDiv.querySelector(`[name="${key}"]`);
                        if (input) {


                            if (input.multiple && Array.isArray(params[key])) {
                                // Handle multi-select fields
                                Array.from(input.options).forEach(option => {
                                    option.selected = params[key].includes(option.value);
                                });
                            } else if (input.type === "color") {
                                // Handle color fields
                                input.value = resolveColorValue(params[key]);
                            }
                            else {
                                console.log("Setting value for " + key + " to " + params[key]);
                                // Handle single-value fields
                                input.value = params[key];
                            }
                        }
                    });
                }
            });
        }

    } catch (e) {
        alert("Invalid YAML format: " + e.message);
    }
}
