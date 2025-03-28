
function addConstraint() {
    const container = document.getElementById("constraintContainer"); // Use the div instead of a form
    const div = document.createElement("div");
    div.classList.add("constraint");
    div.innerHTML = `
        <label>Type:
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
    container.appendChild(div);
    updateFields(div.querySelector("select"));
}

function updateFields(select) {
    const paramsDiv = select.parentElement.nextElementSibling;
    paramsDiv.innerHTML = "";
    const type = select.value;

    if (type === "cyclic") {
        paramsDiv.innerHTML = `
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
    } else if (type === "orientation-sig") {
        paramsDiv.innerHTML = `
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
    } else if (type === "orientation-field") {
        paramsDiv.innerHTML = `
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
    } else if (type === "group") {
        paramsDiv.innerHTML = `
            <label>Field: <input type="text" name="field" required></label>
            <label>Target:
                <select name="target">
                    <option value="range">range</option>
                    <option value="domain">domain</option>
                </select>
            </label>
        `;
    }
}

function removeConstraint(button) {
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
                const type = Object.keys(constraint)[0]; // Get the constraint type
                const params = constraint[type]; // Get the parameters for the constraint

                // Add a new constraint to the structured editor
                const div = document.createElement("div");
                div.classList.add("constraint");
                div.innerHTML = `
            <label>Type:
                <select onchange="updateFields(this)">
                    <option value="cyclic" ${type === "cyclic" ? "selected" : ""}>Cyclic</option>
                    <option value="orientation-field" ${type === "orientation-field" ? "selected" : ""}>Orientation by Field</option>
                    <option value="orientation-sig" ${type === "orientation-sig" ? "selected" : ""}>Orientation by Sig</option>
                    <option value="group" ${type === "group" ? "selected" : ""}>Grouping</option>
                </select>
            </label>
            <div class="params"></div>
            <button type="button" onclick="removeConstraint(this)">Remove</button>
        `;
                container.appendChild(div);

                // Populate the fields based on the constraint type
                const select = div.querySelector("select");
                updateFields(select); // Dynamically generate the fields
                const paramsDiv = div.querySelector(".params");

                // Fill in the values for the generated fields
                Object.keys(params).forEach(key => {
                    const input = paramsDiv.querySelector(`[name="${key}"]`);
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


        // And do something similar for directives
        const directiveContainer = document.getElementById("directiveContainer");


    } catch (e) {
        alert("Invalid YAML format: " + e.message);
    }
}