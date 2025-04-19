function downloadHighResPNG(scaleFactor = 3) {
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

    // Convert SVG string to a data URL
    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function () {
        // Create a canvas with increased resolution
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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

        // Convert to PNG and trigger download
        const pngUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "cnd.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    img.src = url;
}