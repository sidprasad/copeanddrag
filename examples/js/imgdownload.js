async function downloadBundle() {


    // TODO: Bug, this function should only be called once 
    // the user is on the structured editor page.

    //localStorage.setItem('editorView', 'structured');
    // If the user is on the structured editor page,
    // click the         

    const showYamlEditorButton = document.getElementById('showYamlEditor');

    let isStructuredEditor = localStorage.getItem('editorView') === 'structured';
    if (isStructuredEditor) {
        // Click the button to show the YAML editor
        showYamlEditorButton.click();
    }



    // Create a new JSZip instance
    const zip = new JSZip();

    // 1. Add the high-resolution PNG
    const svg = document.getElementById("svg");
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svg);

    // Ensure proper XML declaration
    source = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + source;

    // Get the CSS styles
    const styleSheets = Array.from(document.styleSheets).reduce((acc, styleSheet) => {
        try {
            return acc + Array.from(styleSheet.cssRules).reduce((css, rule) => css + rule.cssText, '');
        } catch (e) {
            console.warn('Could not load stylesheet:', styleSheet.href);
            return acc;
        }
    }, '');

    // Embed the CSS styles into the SVG
    const styleElement = `<style type="text/css"><![CDATA[${styleSheets}]]></style>`;
    source = source.replace('</svg>', `${styleElement}</svg>`);

    // Convert SVG to PNG
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    const pngData = await new Promise((resolve) => {
        img.onload = function () {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            const scaleFactor = 3; // Adjust scale factor for high resolution
            const width = svg.getBoundingClientRect().width * scaleFactor;
            const height = svg.getBoundingClientRect().height * scaleFactor;

            canvas.width = width;
            canvas.height = height;

            // Fill the canvas with a white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Scale up the drawing for better quality
            ctx.scale(scaleFactor, scaleFactor);
            ctx.drawImage(img, 0, 0, width / scaleFactor, height / scaleFactor);

            // Convert to PNG data URL
            resolve(canvas.toDataURL("image/png"));
        };

        img.src = url;
    });

    // Add PNG to the ZIP
    zip.file("cnd.png", pngData.split(",")[1], { base64: true });

    // 2. Add the .cnd file (YAML content)
    const yamlContent = window.editor.getValue();
    zip.file("layout.cnd", yamlContent);

    // 3. Add the datum.xml file
    const datumElement = document.getElementById("alloydatum");
    const datumContent = datumElement ? datumElement.textContent : "<empty/>";
    zip.file("datum.xml", datumContent);

    // Generate the ZIP file and trigger download
    zip.generateAsync({ type: "blob" }).then((content) => {
        const a = document.createElement("a");
        const url = URL.createObjectURL(content);
        a.href = url;
        a.download = "cnddiagram.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}