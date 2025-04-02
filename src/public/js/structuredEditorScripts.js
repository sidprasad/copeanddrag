

const CONSTRAINT_SELECT = `
 <button class="close" title="Remove constraint" type="button" onclick="removeConstraint(this)">
    <span aria-hidden="true">&times;</span>
 </button>
        <label>Type:
            <select onchange="updateFields(this)">
                <option value="cyclic">Cyclic</option>
                <option value="orientation-field">Orientation (Field)</option>
                <option value="orientation-sig">Orientation (Sig)</option>
                <option value="group">Grouping</option>
            </select>
        </label>
        <div class="params"></div>
    `;

const CYCLIC_SELECTOR = `
        <label>Field: <input type="text" name="field" required></label>
        <label>Direction:
            <select name="direction">
                <option value="clockwise">Clockwise</option>
                <option value="counterclockwise">Counterclockwise</option>
            </select>
        </label>
        <label>Applies To:
            <input type="text" name="sourceType" value="univ" placeholder="DEFAULT">
            <input type="text" name="targetType" value="univ" placeholder="DEFAULT">
        </label>
    `;

const ORIENTATION_SIG_SELECTOR = `
    <label>Sigs:</label>
    <div style="display: flex; gap: 10px; align-items: center;">
        <input type="text" name="sig1" class="form-control form-control-sm" placeholder="Sig 1" required>
        <input type="text" name="sig2" class="form-control form-control-sm" placeholder="Sig 2" required>
    </div>
    <label>Directions:            </label>
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

        `;

const ORIENTATION_FIELD_SELECTOR = `
    <label>Field:</label> <input type="text" class="form-control" name="field" required>
    <label>Directions:            </label>
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
    <label>Applies To:</label>
    <div style="display: flex; gap: 10px; align-items: center;">
        <input type="text" class="form-control form-control-sm" name="sourceType" value="univ" placeholder="Source Type">
        <input type="text" class="form-control form-control-sm" name="targetType" value="univ" placeholder="Target Type">
    </div>

`;

const GROUP_SELECTOR = `
    <label>Field: <input type="text" name="field" required></label>
    <label>Target:
        <select name="target">
            <option value="range">range</option>
            <option value="domain">domain</option>
        </select>
    </label>
`;


const DIRECTIVE_SELECT = `
    <button class="close" title="Remove directive" type="button" onclick="removeDirective(this)">
        <span aria-hidden="true">&times;</span>
    </button>
    <label>Type:
        <select onchange="updateFields(this)">
            <option value="attribute">Attribute</option>
            <option value="icon">Icon</option>
            <option value="color">Color</option>
            <option value="projection">Projection</option>
            <option value="flag">Visibility Flag</option>
        </select>
    </label>
    <div class="params"></div>
`;


const ATTRIBUTE_SELECTOR = `
<label>Field:</label> <input type="text" name="field" class="form-control" required>
`;

const PROJECTION_SELECTOR = `
<label>Sig:</label> <input type="text" class="form-control" name="sig" required>
`;

const COLOR_SELECTOR = `
<label>Sig:</label> <input type="text" name="sig" class="form-control" required>
<label>Color:</label> <input type="color" name="value" class="form-control" required>
`;

const ICON_SELECTOR = `
    <label>Sig:</label> <input type="text" name="sig" class="form-control" required placeholder="Sig name">
    <label>Path:</label> <input type="text" name="path" class="form-control" required placeholder="/path/to/icon.png">
    <label>Height:</label> <input type="number" class="form-control" name="height" value="50">
    <label>Width:</label> <input type="number"class="form-control"  name="width" value="70">
`;

const FLAG_SELECTOR = `
<label>Target:</label>
<select name="flag" class="form-control">
    <option value="hideDisconnectedBuiltIns">Hide disconnected built ins.</option>
    <option value="hideDisconnected">Hide all disconnected.</option>
</select>
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


function updateFields(select) {
    const paramsDiv = select.parentElement.nextElementSibling;
    paramsDiv.innerHTML = "";
    const type = select.value;


    // Constraint Fields
    if (type === "cyclic") {
        paramsDiv.innerHTML = CYCLIC_SELECTOR;
    } else if (type === "orientation-sig") {
        paramsDiv.innerHTML = ORIENTATION_SIG_SELECTOR;
    } else if (type === "orientation-field") {
        paramsDiv.innerHTML = ORIENTATION_FIELD_SELECTOR;
    } else if (type === "group") {
        paramsDiv.innerHTML = GROUP_SELECTOR;
    }



    // Directive Fields
    if (type === "attribute") {
        paramsDiv.innerHTML = ATTRIBUTE_SELECTOR;
    } else if (type === "icon") {
        paramsDiv.innerHTML = ICON_SELECTOR;
    } else if (type === "color") {
        paramsDiv.innerHTML = COLOR_SELECTOR;
    } else if (type === "projection") {
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
    if (t === "orientation-field") {
        return "orientation";
    }
    if (t === "orientation-sig") {
        return "orientation";
    }
    if (t === "group") {
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

function writeToYAMLEditor() {
    console.log("Writing to YAML editor");
    const constraints = [];
    const directives = [];


    document.querySelectorAll(".constraint").forEach(div => {
        const type = div.querySelector("select").value;
        const params = {};

        if (type === "orientation-sig") {
            params['sigs'] = [];
        } else if (type === "orientation-field" || type === "cyclic") {
            params['appliesTo'] = [];
        }




        div.querySelectorAll("input, select").forEach(input => {
            if (input.multiple) {
                params[input.name] = Array.from(input.selectedOptions).map(option => option.value);
            } else if (input.name === "sourceType") {
                params['appliesTo'][0] = input.value;
            } else if (input.name === "targetType") {
                params['appliesTo'][1] = input.value;
            } else if (input.name === "sig1") {
                params['sigs'][0] = input.value;
            } else if (input.name === "sig2") {
                params['sigs'][1] = input.value;
            } else if (input.name.length > 0) {
                params[input.name] = input.value;
            }
        });

        constraints.push({ [toYamlConstraintType(type)]: params });
    });


    console.log("Now directives");

    document.querySelectorAll(".directive").forEach(div => {
        const type = div.querySelector("select").value;

        let params = {};
        const isIcon = type === "icon";
        const isFlag = type === "flag";

        if (isIcon) {
            params['icon'] = {};
        }



        div.querySelectorAll("input, select").forEach(input => {


            let key = input.name;
            let value = input.value;


            if (key.length > 0) {
                // Hacky special case
                if (isIcon && (key === "height" || key === "width" || key === "path")) {
                    params['icon'][key] = value;
                } else if (input.multiple) {
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

    if(Object.keys(combinedSpec).length > 0) {
        yamlStr = jsyaml.dump(combinedSpec);
    }

    // const yamlStr = jsyaml.dump(combinedSpec);

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

    if (type == "cyclic") {
        return "cyclic";
    }
    if (type == "orientation") {
        if (params["sigs"]) {
            return "orientation-sig";
        }
        if (params["field"]) {
            return "orientation-field";
        }
    }

    if (type == "group") {
        return "group";
    }
    return "unknown";


}


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

                    // sigs and appliesTo are special cases
                    if (key == "sigs") {

                        let input1 = paramsDiv.querySelector(`[name="sig1"]`);
                        let input2 = paramsDiv.querySelector(`[name="sig2"]`);
                        if (input1) {
                            input1.value = params["sigs"][0];
                        }
                        if (input2) {
                            input2.value = params["sigs"][1];
                        }
                    }
                    else if (key == "appliesTo") {
                        let input1 = paramsDiv.querySelector(`[name="sourceType"]`);
                        let input2 = paramsDiv.querySelector(`[name="targetType"]`);
                        if (input1) {
                            input1.value = params["appliesTo"][0];
                        }
                        if (input2) {
                            input2.value = params["appliesTo"][1];
                        }
                    }
                    else {


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


                        if (key == "icon") {
                            Object.keys(params[key]).forEach(iconKey => {
                                let iconInput = paramsDiv.querySelector(`[name="${iconKey}"]`);
                                if (iconInput) {
                                    iconInput.value = params[key][iconKey];
                                }
                            });
                        }
                        else {


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
                        }


                    });
                }
            });
        }

    } catch (e) {
        alert("Invalid YAML format: " + e.message);
    }
}
