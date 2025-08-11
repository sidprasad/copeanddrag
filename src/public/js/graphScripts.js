/**
 * Graph-related functionality for the CnD layout controls
 * Handles Alloy data processing, layout generation, and graph rendering
 */

// Variables to store data
window.currentInstanceLayout = null;

/**
 * Get current Alloy XML from input field
 * @returns {string} Alloy XML specification
 */
function getCurrentAlloyXml() {
    return document.getElementById('alloydatum').value.trim();
}

/**
 * Get current CND specification from input field  
 * @returns {string} CND layout specification
 */
function getCurrentCNDSpec() {
    // Try to get value from React component first
    console.log('Getting current CND spec from React', window.getCurrentCNDSpecFromReact);
    return window.getCurrentCNDSpecFromReact ? 
        window.getCurrentCNDSpecFromReact() : 
        document.getElementById('webcola-cnd')?.value?.trim();
}

/**
 * Initialize the Alloy pipeline components
 * @returns {boolean} Success status
 */
async function initializePipeline() {
    try {
        console.log('Complete CND-Core browser bundle loaded successfully');
        console.log('Available on global CndCore:', Object.keys(CndCore));
        
        // Check for Alloy-specific components
        console.log('parseAlloyXML available:', !!CndCore.AlloyInstance.parseAlloyXML);
        console.log('ForgeEvaluator available:', !!CndCore.ForgeEvaluator);
        console.log('LayoutInstance available:', !!CndCore.LayoutInstance);
        console.log('parseLayoutSpec available:', !!CndCore.parseLayoutSpec);
        
        updateStatus('Alloy pipeline ready! Enter Alloy XML and CND specifications now.', 'success');
        
        return true;
    } catch (error) {
        console.error('Failed to initialize Alloy pipeline:', error);
        updateStatus(`Pipeline init failed: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Process Alloy data using the complete Alloy → ForgeEvaluator → Layout pipeline
 * @param {number} instanceNumber - Instance number to process (default 0)
 */
async function loadAlloyData(instanceNumber = 0) {
    try {
        updateStatus('Processing Alloy data with ForgeEvaluator...', 'info');

        // Get Alloy XML from input field
        const alloyXml = getCurrentAlloyXml();
        if (!alloyXml) {
            throw new Error('Please enter an Alloy XML instance');
        }

        // Get CND specification from input field
        const cndSpec = getCurrentCNDSpec() || "";

        console.log('Using Alloy XML:', alloyXml.substring(0, 200) + '...');
        console.log('Using CND Spec:', cndSpec.substring(0, 200) + '...');

        // Step 1: Parse Alloy XML
        updateStatus('Parsing Alloy XML...', 'info');
        const alloyDatum = CndCore.AlloyInstance.parseAlloyXML(alloyXml);
        console.log('Parsed Alloy Datum:', alloyDatum);
        
        if (!alloyDatum.instances || alloyDatum.instances.length === 0) {
            throw new Error('No instances found in Alloy XML');
        }

        const alloyDataInstance = new CndCore.AlloyDataInstance(alloyDatum.instances[instanceNumber]);

        console.log('Using Alloy Data Instance:', alloyDataInstance);
        console.log('Types via Alloy IDataInstance:', alloyDataInstance.getTypes().length);
        console.log('Atoms via Alloy IDataInstance:', alloyDataInstance.getAtoms().length);
        console.log('Relations via Alloy IDataInstance:', alloyDataInstance.getRelations().length);

        // Step 2: Create ForgeEvaluator with Alloy data
        updateStatus('Creating ForgeEvaluator...', 'info');

        let evaluationContext = {
            sourceData: alloyXml,
        }; //alloyDatum
        const forgeEvaluator = new CndCore.ForgeEvaluator();
        forgeEvaluator.initialize(evaluationContext);

        console.log('Created ForgeEvaluator:', forgeEvaluator);

        // Step 3: Parse layout specification
        updateStatus('Parsing layout specification...', 'info');
        let layoutSpec = null;
        try {
            layoutSpec = CndCore.parseLayoutSpec(cndSpec);
            if (window.clearAllErrors) {
                window.clearAllErrors();
            }
        } catch (error) {
            console.error('Layout spec parse error:', error);
            if (window.showParseError) {
                window.showParseError(error.message, 'Layout Specification');
            } else {
                updateStatus(`Layout spec parse error: ${error.message}`, 'error');
            }
            return;
        }
        console.log('Parsed Layout Spec:', layoutSpec);

        // Step 4: Create LayoutInstance with ForgeEvaluator
        updateStatus('Creating layout instance with ForgeEvaluator...', 'info');
        const ENABLE_ALIGNMENT_EDGES = true;
        
        const layoutInstance = new CndCore.LayoutInstance(
            layoutSpec, 
            forgeEvaluator, 
            instanceNumber, 
            ENABLE_ALIGNMENT_EDGES
        );
        console.log('Created Layout Instance with ForgeEvaluator:', layoutInstance);

        // Step 5: Generate layout using Alloy data instance
        updateStatus('Generating layout with Alloy data...', 'info');
        const projections = {};
        const layoutResult = layoutInstance.generateLayout(alloyDataInstance, projections);
        window.currentInstanceLayout = layoutResult.layout;

        if (layoutResult.error) {
            console.error('Layout generation error:', layoutResult.error);

            // Check if this is a constraint conflict error
            if (layoutResult.error.errorMessages) {
                if (window.showPositionalError) {
                    window.showPositionalError(layoutResult.error.errorMessages);
                } else {
                    updateStatus(`Positional constraint conflict: ${layoutResult.error.message}`, 'error');
                }
            } else if (layoutResult.error.overlappingNodes) {
                if (window.showGroupOverlapError) {
                    window.showGroupOverlapError(layoutResult.error.message);
                } else {
                    updateStatus(`Group overlap error: ${layoutResult.error.message}`, 'error');
                }
            } else {
                if (window.showGeneralError) {
                    window.showGeneralError(`Layout generation error: ${layoutResult.error.message}`);
                } else {
                    updateStatus(`Layout generation error: ${layoutResult.error.message}`, 'error');
                }
            }
            return;
        }

        // Clear errors on successful layout generation
        if (window.clearAllErrors) {
            window.clearAllErrors();
        }

        console.log('Generated Instance Layout using Alloy pipeline:', window.currentInstanceLayout);

        updateStatus('Alloy pipeline complete with ForgeEvaluator! Ready to render.', 'success');
        
    } catch (error) {
        console.error('Failed to load Alloy data:', error);
        updateStatus(`Alloy data loading failed: ${error.message}`, 'error');
    }
}

/**
 * Render the graph using the webcola-cnd-graph custom element
 */
async function renderGraph() {
    clearGraph(); // Clear existing graph first
    const graphElement = document.getElementById('graph-container');
    
    try {
        if (!window.currentInstanceLayout) {
            updateStatus('No layout data available. Processing Alloy data first...', 'info');
            await loadAlloyData();
            if (!window.currentInstanceLayout) {
                throw new Error('Failed to generate layout data from Alloy');
            }
        }

        updateStatus('Rendering Alloy graph with WebCola...', 'info');

        // Use the real InstanceLayout data with WebCola custom element
        console.log('Using Instance Layout for rendering:', window.currentInstanceLayout);
        await graphElement.renderLayout(window.currentInstanceLayout);
        
        updateStatus('Alloy graph rendered successfully!', 'success');
    } catch (error) {
        console.error('Error rendering Alloy graph:', error);
        updateStatus(`Alloy render error: ${error.message}`, 'error');
    }
}

/**
 * Clear the graph SVG content
 */
function clearGraph() {
    const graphElement = document.getElementById('graph-container');
    
    // Clear the graph
    if (graphElement.clear) {
        // FIXME: The graphElement needs a clear() method
        graphElement.clear();
    } else {
        // Fallback: remove all SVG content
        const svg = graphElement.shadowRoot?.querySelector('svg');
        if (svg) {
            const container = svg.querySelector('.zoomable');
            if (container) {
                container.innerHTML = '';
            }
        }
    }
    
    updateStatus('Graph cleared.', 'info');
}

/**
 * Change the layout format and re-render the graph
 */
async function changeLayoutFormat() {
    const graphElement = document.getElementById('graph-container');
    const layoutFormat = document.getElementById('layoutFormat').value;
    graphElement.setAttribute('layoutFormat', layoutFormat);
    console.log(`Layout format changed to: ${layoutFormat}`);

    // Re-render the graph with the new layout format
    try {
        if (!window.currentInstanceLayout) {
            throw new Error('No layout data available. Please load an Alloy graph first.');
        }
        await graphElement.renderLayout(window.currentInstanceLayout);
        updateStatus('Graph layout changed successfully!', 'success');
    } catch (error) {
        console.error('Error rendering graph:', error);
        updateStatus(`Render error: ${error.message}`, 'error');
    }
}

// Create GraphAPI namespace for organized access
window.GraphAPI = {
    initializePipeline,
    loadAlloyData,
    renderGraph,
    clearGraph,
    changeLayoutFormat,
    getCurrentAlloyXml,
    getCurrentCNDSpec,
    
    // Getter for current layout (useful for external access)
    getCurrentLayout: () => window.currentInstanceLayout
};

// Also expose individual functions globally for backward compatibility
window.loadAlloyData = loadAlloyData;
window.renderGraph = renderGraph;
window.clearGraph = clearGraph;
window.changeLayoutFormat = changeLayoutFormat;


/**
 * Client-side equivalent of generateDiagram function
 * Processes form data and renders diagram without server roundtrip
 * @param {number} instanceNumber - Instance number to render (default 0)
 */
async function generateDiagram(instanceNumber = 0) {
    try {
        updateStatus('Generating diagram...', 'info');
        
        // Get form data (equivalent to req.body)
        const formData = getClientFormData();
        
        // Validate required data
        if (!formData.alloydatum) {
            console.error('Missing Alloy XML data:', formData.alloydatum);
            throw new Error('Needs an Alloy instance to generate a diagram');
        }
        
        // Process the data using existing pipeline
        await loadAlloyData(instanceNumber);
        
        if (!window.currentInstanceLayout) {
            throw new Error('Failed to generate layout from provided data');
        }
        
        // Render the graph
        await renderGraph(instanceNumber);
        
        updateStatus('Diagram generated successfully!', 'success');
        
    } catch (error) {
        console.error('Client-side diagram generation failed:', error);
        updateStatus(`Diagram generation failed: ${error.message}`, 'error');
    }
}

/**
 * Get form data from current page
 */
function getClientFormData() {
    return {
        alloydatum: getCurrentAlloyXml(),
        cope: getCurrentCNDSpec(),
    };
}

// Add to GraphAPI
window.GraphAPI.generateDiagram = generateDiagram;