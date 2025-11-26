/**
 * Graph-related functionality for the CnD layout controls
 * Handles Alloy data processing, layout generation, and graph rendering
 */

// Variables to store data
window.currentInstanceLayout = null;

// Centralized storage for diagram inputs
const diagramInputs = {
    alloyXml: '',
    cndSpec: ''
};

const getCndCore = () => {
    // Prefer correct casing (CnDCore) with Alloy APIs
    if (window.CnDCore?.AlloyInstance?.parseAlloyXML) return window.CnDCore;
    if (window.CndCore?.AlloyInstance?.parseAlloyXML) return window.CndCore;
    return window.CnDCore || window.CndCore;
};
const safeTrim = (value) => typeof value === 'string' ? value.trim() : '';
const readLocal = (key) => {
    try {
        return localStorage.getItem(key) || '';
    } catch (err) {
        console.warn(`Unable to read ${key} from localStorage`, err);
        return '';
    }
};
const writeLocal = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (err) {
        console.warn(`Unable to write ${key} to localStorage`, err);
    }
};

/**
 * Set the current diagram inputs and sync them to the page/localStorage
 * @param {Object} inputs
 * @param {string} [inputs.alloyXml] - Alloy XML text
 * @param {string} [inputs.cndSpec] - CND spec text
 * @param {Object} [options]
 * @param {boolean} [options.persist=true] - Whether to persist to localStorage
 */
function setDiagramInputs({ alloyXml, cndSpec } = {}, { persist = true } = {}) {
    const alloyValue = typeof alloyXml === 'string' ? safeTrim(alloyXml) : null;
    const cndValue = typeof cndSpec === 'string' ? safeTrim(cndSpec) : null;

    if (alloyValue !== null) {
        diagramInputs.alloyXml = alloyValue;
        const alloyTextarea = document.getElementById('alloydatum');
        if (alloyTextarea && safeTrim(alloyTextarea.value) !== alloyValue) {
            alloyTextarea.value = alloyValue;
        }
        if (persist) {
            writeLocal('alloyDatum', alloyValue);
        }
    }

    if (cndValue !== null) {
        diagramInputs.cndSpec = cndValue;
        const cndSpecContainer = document.getElementById('cndSpec');
        if (cndSpecContainer && safeTrim(cndSpecContainer.textContent) !== cndValue) {
            cndSpecContainer.textContent = cndValue;
        }
        if (persist) {
            writeLocal('cndSpec', cndValue);
        }
    }
}

/**
 * Get current Alloy XML from input field
 * @returns {string} Alloy XML specification
 */
function getCurrentAlloyXml() {
    const alloyTextarea = document.getElementById('alloydatum');
    const textareaValue = safeTrim(alloyTextarea?.value);
    const storedValue = safeTrim(diagramInputs.alloyXml) || safeTrim(readLocal('alloyDatum'));
    const pendingSession = safeTrim(window.pendingSessionAlloyXml);
    const chosen = textareaValue || storedValue || pendingSession;

    if (chosen && alloyTextarea && safeTrim(alloyTextarea.value) !== chosen) {
        alloyTextarea.value = chosen;
    }
    if (chosen && diagramInputs.alloyXml !== chosen) {
        diagramInputs.alloyXml = chosen;
    }

    return chosen;
}

/**
 * Quick check for whether we have any Alloy datum available
 * @returns {boolean}
 */
function hasAlloyDatum() {
    return !!getCurrentAlloyXml();
}

/**
 * Get current CND specification from input field  
 * @returns {string} CND layout specification
 */
function getCurrentCNDSpec() {
    const hiddenSpec = document.getElementById('cndSpec');
    // Try to get value from React component first
    const reactValue = typeof window.getCurrentCNDSpecFromReact === 'function'
        ? safeTrim(window.getCurrentCNDSpecFromReact())
        : '';
    const legacyInput = safeTrim(document.getElementById('webcola-cnd')?.value);
    const hiddenValue = safeTrim(hiddenSpec?.textContent);
    const storedValue = safeTrim(diagramInputs.cndSpec) || safeTrim(readLocal('cndSpec'));
    const pendingSession = safeTrim(window.pendingSessionCndSpec);

    const chosen = reactValue || legacyInput || hiddenValue || storedValue || pendingSession;

    if (chosen && hiddenSpec && safeTrim(hiddenSpec.textContent) !== chosen) {
        hiddenSpec.textContent = chosen;
    }
    if (chosen && diagramInputs.cndSpec !== chosen) {
        diagramInputs.cndSpec = chosen;
    }

    return chosen;
}

/**
 * Initialize the Alloy pipeline components
 * @returns {boolean} Success status
 */
async function initializePipeline() {
    const core = getCndCore();
    if (!core) {
        updateStatus('CnDCore library not loaded yet.', 'error');
        throw new Error('CnDCore global not available');
    }

    try {
        console.log('Complete CND-Core browser bundle loaded successfully');
        console.log('Available on global CnDCore:', Object.keys(core));
        
        // Check for Alloy-specific components
        console.log('parseAlloyXML available:', !!core.AlloyInstance?.parseAlloyXML);
        console.log('ForgeEvaluator available:', !!core.ForgeEvaluator);
        console.log('LayoutInstance available:', !!core.LayoutInstance);
        console.log('parseLayoutSpec available:', !!core.parseLayoutSpec);
        
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
async function generateLayoutForInstance(instanceNumber = 0, { storeLayout = true } = {}) {
    const core = getCndCore();
    if (!core) {
        throw new Error('CnDCore library is not loaded');
    }

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
    const alloyDatum = core.AlloyInstance.parseAlloyXML(alloyXml);
    window.parsedAlloyXML = alloyDatum;
    console.log('Parsed Alloy Datum:', alloyDatum);

    if (!alloyDatum.instances || alloyDatum.instances.length === 0) {
        throw new Error('No instances found in Alloy XML');
    }

    if (instanceNumber < 0 || instanceNumber >= alloyDatum.instances.length) {
        throw new Error(`Invalid instance number: ${instanceNumber}. Must be between 0 and ${alloyDatum.instances.length - 1}`);
    }

    const alloyDataInstance = new core.AlloyDataInstance(alloyDatum.instances[instanceNumber]);

    console.log('Using Alloy Data Instance:', alloyDataInstance);
    console.log('Types via Alloy IDataInstance:', alloyDataInstance.getTypes().length);
    console.log('Atoms via Alloy IDataInstance:', alloyDataInstance.getAtoms().length);
    console.log('Relations via Alloy IDataInstance:', alloyDataInstance.getRelations().length);

    // Step 2: Create ForgeEvaluator with Alloy data
    updateStatus('Creating ForgeEvaluator...', 'info');

    let evaluationContext = {
        sourceData: alloyXml,
    }; //alloyDatum
    const forgeEvaluator = new core.ForgeEvaluator();
    forgeEvaluator.initialize(evaluationContext);

    console.log('Created ForgeEvaluator:', forgeEvaluator);

    // NOTE: Mount the Evaluator REPL component
    if (window.mountEvaluatorRepl) {
        window.mountEvaluatorRepl('evaluator-repl-mount', forgeEvaluator, instanceNumber);
    } else {
        console.warn('Evaluator REPL mounting function not available, skipping REPL mount');
    }

    // Step 3: Parse layout specification
    updateStatus('Parsing layout specification...', 'info');
    let layoutSpec = null;
    try {
        layoutSpec = core.parseLayoutSpec(cndSpec);
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
        return null;
    }
    console.log('Parsed Layout Spec:', layoutSpec);

    // Step 4: Create LayoutInstance with ForgeEvaluator
    updateStatus('Creating layout instance with ForgeEvaluator...', 'info');
    const ENABLE_ALIGNMENT_EDGES = true;

    const layoutInstance = new core.LayoutInstance(
        layoutSpec,
        forgeEvaluator,
        instanceNumber,
        ENABLE_ALIGNMENT_EDGES
    );
    console.log('Created Layout Instance with ForgeEvaluator:', layoutInstance);

    // Step 5: Generate layout using Alloy data instance
    updateStatus('Generating layout with Alloy data...', 'info');
    const projections = {};

    try {
        const layoutResult = layoutInstance.generateLayout(alloyDataInstance, projections);
        if (storeLayout) {
            window.currentInstanceLayout = layoutResult.layout;
        }

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
            return null;
        }

        // Clear errors on successful layout generation
        if (window.clearAllErrors) {
            window.clearAllErrors();
        }

        console.log('Generated Instance Layout using Alloy pipeline:', storeLayout ? window.currentInstanceLayout : layoutResult.layout);
        return layoutResult.layout;
    } catch (error) {
        if (window.showGeneralError) {
            window.showGeneralError(`Layout generation failed: ${error.message}`);
        } else {
            updateStatus(`Layout generation failed: ${error.message}`, 'error');
        }
        return null;
    }
}

async function loadAlloyData(instanceNumber = 0) {
    try {
        const layout = await generateLayoutForInstance(instanceNumber, { storeLayout: true });
        if (!layout) {
            throw new Error('Failed to generate layout data from Alloy');
        }

        updateStatus('Alloy pipeline complete with ForgeEvaluator! Ready to render.', 'success');
        return layout;
    } catch (error) {
        console.error('Failed to load Alloy data:', error);
        updateStatus(`Alloy data loading failed: ${error.message}`, 'error');
        return null;
    }
}

/**
 * Render the graph using the webcola-cnd-graph custom element
 */
async function renderGraph(instanceNumber = 0) {
    clearGraph(); // Clear existing graph first; sets window.currentInstanceLayout to null
    const graphElement = document.getElementById('graph-container');
    
    try {
        if (!window.currentInstanceLayout) {
            updateStatus('No layout data available. Processing Alloy data first...', 'info');
            const layout = await loadAlloyData(instanceNumber);
            if (!layout) {
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
 * Render a specific instance into any WebCola graph element
 */
async function renderGraphForInstance(elementId, instanceNumber = 0, { storeLayout = false } = {}) {
    const graphElement = typeof elementId === 'string'
        ? document.getElementById(elementId)
        : elementId;

    if (!graphElement) {
        throw new Error(`Graph element ${elementId} not found`);
    }

    const layout = await generateLayoutForInstance(instanceNumber, { storeLayout });
    if (!layout) {
        throw new Error('Failed to generate layout for temporal comparison');
    }

    await graphElement.renderLayout(layout);
    return layout;
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

    // Clear stored layout data
    window.currentInstanceLayout = null;
    
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
    renderGraphForInstance,
    clearGraph,
    changeLayoutFormat,
    getCurrentAlloyXml,
    getCurrentCNDSpec,
    setDiagramInputs,
    hasAlloyDatum,
    
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
            console.warn('Missing Alloy XML data:', formData.alloydatum);
            updateStatus('Load or paste an Alloy XML instance first.', 'error');
            return;
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
    // Sync the latest inputs into storage so subsequent reads (exports/refresh) are consistent
    setDiagramInputs({
        alloyXml: getCurrentAlloyXml(),
        cndSpec: getCurrentCNDSpec(),
    });

    return {
        alloydatum: getCurrentAlloyXml(),
        cope: getCurrentCNDSpec(),
    };
}

// Add to GraphAPI
window.GraphAPI.generateDiagram = generateDiagram;
