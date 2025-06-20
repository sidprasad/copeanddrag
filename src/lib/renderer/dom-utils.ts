import * as d3 from 'd3';
import { 
    BoundingBox, 
    LabelPosition, 
    SVGPathElementWithMethods,
    HTMLInputElementWithValue 
} from './types';
import { calculateOverlapArea } from './utils';

/**
 * Minimize overlap between labels by adjusting position
 * This function requires DOM access and is client-side only
 */
export function minimizeOverlap(currentLabel: SVGTextElement, overlapsWith: SVGTextElement[]): void {
    const originalBBox = currentLabel.getBBox();
    let minOverlapArea = Infinity;
    let bestPosition: LabelPosition = { dx: 0, dy: 0, textAnchor: 'middle' };
    
    const positions: LabelPosition[] = [
        { dx: 0, dy: 0, textAnchor: 'middle' },
        { dx: 2, dy: 0, textAnchor: 'start' },
        { dx: -2, dy: 0, textAnchor: 'end' },
        { dx: 0, dy: '1em', textAnchor: 'middle' }
    ];
    
    positions.forEach(position => {
        let totalOverlapArea = 0;
        
        d3.select(currentLabel)
            .attr('dx', position.dx)
            .attr('dy', position.dy)
            .attr('text-anchor', position.textAnchor);
            
        const newBBox = currentLabel.getBBox();
        
        overlapsWith.forEach(overlapLabel => {
            const overlapBBox = overlapLabel.getBBox();
            totalOverlapArea += calculateOverlapArea(newBBox, overlapBBox);
        });
        
        if (totalOverlapArea < minOverlapArea) {
            minOverlapArea = totalOverlapArea;
            bestPosition = position;
        }
    });
    
    d3.select(currentLabel)
        .attr('dx', bestPosition.dx)
        .attr('dy', bestPosition.dy)
        .attr('text-anchor', bestPosition.textAnchor);
}

/**
 * Get the scale factor from DOM input element
 */
export function getScaleFactorFromDOM(): number {
    const scaleFactorInput = document.getElementById("scaleFactor") as HTMLInputElementWithValue | null;
    return scaleFactorInput ? parseFloat(scaleFactorInput.value) : 1;
}

/**
 * Set up scale factor change listener
 */
export function setupScaleFactorListener(callback: (scaleFactor: number) => void): void {
    const scaleFactorInput = document.getElementById("scaleFactor") as HTMLInputElementWithValue | null;
    
    if (scaleFactorInput) {
        scaleFactorInput.addEventListener("change", function() {
            const scaleFactor = parseFloat(scaleFactorInput.value);
            callback(scaleFactor);
        });
    }
}

/**
 * Get path midpoint for label positioning
 */
export function getPathMidpoint(linkId: string): { x: number; y: number } | null {
    const pathElement = document.querySelector(`path[data-link-id="${linkId}"]`) as SVGPathElementWithMethods | null;
    
    if (pathElement && pathElement.getTotalLength) {
        const pathLength = pathElement.getTotalLength();
        return pathElement.getPointAtLength(pathLength / 2);
    }
    
    return null;
}

/**
 * Show runtime error message in DOM
 */
export function showRuntimeError(message: string, details?: string): void {
    const runtimeMessages = document.getElementById("runtime_messages");
    if (!runtimeMessages) return;
    
    const dismissableAlert = document.createElement("div");
    dismissableAlert.className = "alert alert-warning alert-dismissible";
    dismissableAlert.innerHTML = `
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
        <strong>Runtime Warning:</strong> ${message}
        ${details ? `<br><small>${details}</small>` : ''}
    `;
    
    runtimeMessages.appendChild(dismissableAlert);
}

/**
 * Check if two labels overlap
 */
export function isOverlapping(label1: SVGTextElement, label2: SVGTextElement): boolean {
    const bbox1 = label1.getBBox();
    const bbox2 = label2.getBBox();
    
    return !(bbox1.x + bbox1.width < bbox2.x || 
             bbox2.x + bbox2.width < bbox1.x || 
             bbox1.y + bbox1.height < bbox2.y || 
             bbox2.y + bbox2.height < bbox1.y);
}

/**
 * Send timing data to server
 */
export function sendTimingData(clientTime: number): void {
    fetch('/timing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientTime })
    }).catch(error => {
        console.warn('Failed to send timing data:', error);
    });
}
