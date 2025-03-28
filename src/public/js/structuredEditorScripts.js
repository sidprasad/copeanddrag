

//     <!-- TODO: We need to sync to YAML before ApplyLayout is called, if this is visible.>



const CONSTRAINT_SELECT = `
        <label>Constraint Type:
            <select onchange="updateFields(this)">
                <option value="cyclic">Cyclic</option>
                <option value="orientation-field">Orientation by Field</option>
                <option value="orientation-sig">Orientation by Sig</option>
                <option value="group">Grouping</option>
            </select>
        </label>
        <div class="params"></div>
        <button type="button" onclick="removeConstraint(this)">Remove</button>
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
            <label>Sigs:
                <input type="text" name="sig1" value="" placeholder="Sig 1" required>
                <input type="text" name="sig2" value="" placeholder="Sig 2" required>
            </label>
            <label>Directions:
                <select name="directions" multiple>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                    <option value="directlyLeft">Directly Left</option>
                    <option value="directlyRight">Directly Right</option>
                    <option value="directlyAbove">Directly Above</option>
                    <option value="directlyBelow">Directly Below</option>
                </select>
            </label>
        `;

const ORIENTATION_FIELD_SELECTOR = `
    <label>Field: <input type="text" name="field" required></label>
    <label>Directions:
        <select name="directions" multiple>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="above">Above</option>
            <option value="below">Below</option>
            <option value="directlyLeft">Directly Left</option>
            <option value="directlyRight">Directly Right</option>
            <option value="directlyAbove">Directly Above</option>
            <option value="directlyBelow">Directly Below</option>
        </select>
    </label>
    <label>Applies To:
        <input type="text" name="sourceType" value="univ" placeholder="DEFAULT">
        <input type="text" name="targetType" value="univ" placeholder="DEFAULT">
    </label>
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
        <label>Directive Type:
            <select onchange="updateFields(this)">
                <option value="attribute">Attribute</option>
                <option value="icon">Icon</option>
                <option value="color">Color</option>
                <option value="projection">Projection</option>
                <option value="flag">Visibility Flag</option>
            </select>
        </label>
        <div class="params"></div>
        <button type="button" onclick="removeDirective(this)">Remove</button>
    `;


const ATTRIBUTE_SELECTOR = `
<label>Field: <input type="text" name="field" required></label>
`;

const PROJECTION_SELECTOR = `
<label>Sig: <input type="text" name="sig" required></label>
`;

const COLOR_SELECTOR = `
<label>Sig: <input type="text" name="sig" required></label>
<label>Color: <input type="color" name="color" required></label>
`;

const ICON_SELECTOR = `
    <label>Sig: <input type="text" name="sig" required placeholder="Enter signature"></label>
    <label>Icon Path: <input type="text" name="path" required placeholder="/path/to/icon.png"></label>
    <label>Height: <input type="number" name="height" value="50"></label>
    <label>Width: <input type="number" name="width" value="70"></label>
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

function writeToYAMLEditor() {
    console.log("Writing to YAML editor");
    const constraints = [];
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

        constraints.push({ [type]: params });
    });

    const yamlStr = jsyaml.dump({ constraints });

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
        // Get the YAML content from the editor
        const yamlContent = window.editor.getValue();
        const parsedYaml = jsyaml.load(yamlContent);

        // Clear the existing constraints in the structured editor
        const container = document.getElementById("constraintContainer");
        container.innerHTML = "";

        // Populate the structured editor with constraints from the YAML
        if (parsedYaml && parsedYaml.constraints) {
            parsedYaml.constraints.forEach(constraint => {

                const type = get_constraint_type_from_yaml(constraint);
                const params = constraint[Object.keys(constraint)[0]];

                // Add a new constraint to the structured editor
                const div = document.createElement("div");
                div.classList.add("constraint");
                div.innerHTML = CONSTRAINT_SELECT;


                let sel = div.querySelector("select");
                sel.value = type;
                container.appendChild(div);

                updateFields(sel); // Dynamically generate the fields
                const paramsDiv = div.querySelector(".params");


                // Fill in the values for the generated fields
                Object.keys(params).forEach(key => {

                    // This isn't right, since it depends on the query type. 
                    // THere isn't a one-to-one mapping between the yaml and structured edit.




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


        // And do something similar for directives
        const directiveContainer = document.getElementById("directiveContainer");


    } catch (e) {
        alert("Invalid YAML format: " + e.message);
    }
}
