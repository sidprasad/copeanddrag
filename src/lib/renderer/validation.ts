import { Node, Edge, Constraint, Group, RendererConfig, LayoutDependencies } from './types';

/**
 * Validation utilities for renderer inputs
 */

export class RendererValidationError extends Error {
    constructor(message: string, public field?: string) {
        super(message);
        this.name = 'RendererValidationError';
    }
}

/**
 * Validate nodes array
 */
export function validateNodes(nodes: Node[]): void {
    if (!Array.isArray(nodes)) {
        throw new RendererValidationError('Nodes must be an array', 'nodes');
    }
    
    if (nodes.length === 0) {
        throw new RendererValidationError('Nodes array cannot be empty', 'nodes');
    }
    
    nodes.forEach((node, index) => {
        if (!node.id) {
            throw new RendererValidationError(`Node at index ${index} must have an id`, 'nodes');
        }
        
        if (typeof node.id !== 'string') {
            throw new RendererValidationError(`Node id at index ${index} must be a string`, 'nodes');
        }
    });
    
    // Check for duplicate IDs
    const ids = new Set();
    nodes.forEach((node, index) => {
        if (ids.has(node.id)) {
            throw new RendererValidationError(`Duplicate node id "${node.id}" at index ${index}`, 'nodes');
        }
        ids.add(node.id);
    });
}

/**
 * Validate edges array
 */
export function validateEdges(edges: Edge[], nodes: Node[]): void {
    if (!Array.isArray(edges)) {
        throw new RendererValidationError('Edges must be an array', 'edges');
    }
    
    const nodeIds = new Set(nodes.map(n => n.id));
    
    edges.forEach((edge, index) => {
        if (!edge.id) {
            throw new RendererValidationError(`Edge at index ${index} must have an id`, 'edges');
        }
        
        if (!edge.source || !edge.target) {
            throw new RendererValidationError(`Edge "${edge.id}" must have source and target`, 'edges');
        }
        
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
        
        if (!nodeIds.has(sourceId)) {
            throw new RendererValidationError(`Edge "${edge.id}" references unknown source node "${sourceId}"`, 'edges');
        }
        
        if (!nodeIds.has(targetId)) {
            throw new RendererValidationError(`Edge "${edge.id}" references unknown target node "${targetId}"`, 'edges');
        }
    });
}

/**
 * Validate constraints array
 */
export function validateConstraints(constraints: Constraint[]): void {
    if (!Array.isArray(constraints)) {
        throw new RendererValidationError('Constraints must be an array', 'constraints');
    }
    
    constraints.forEach((constraint, index) => {
        if (!constraint.type) {
            throw new RendererValidationError(`Constraint at index ${index} must have a type`, 'constraints');
        }
        
        if (constraint.type === 'separation' && typeof constraint.gap !== 'number') {
            throw new RendererValidationError(`Separation constraint at index ${index} must have a numeric gap`, 'constraints');
        }
    });
}

/**
 * Validate groups array
 */
export function validateGroups(groups: Group[], nodes: Node[]): void {
    if (!Array.isArray(groups)) {
        throw new RendererValidationError('Groups must be an array', 'groups');
    }
    
    const nodeIds = new Set(nodes.map(n => n.id));
    
    groups.forEach((group, index) => {
        if (!Array.isArray(group.leaves)) {
            throw new RendererValidationError(`Group at index ${index} must have a leaves array`, 'groups');
        }
        
        group.leaves.forEach((leaf, leafIndex) => {
            const leafId = typeof leaf === 'string' ? leaf : leaf.id;
            if (!nodeIds.has(leafId)) {
                throw new RendererValidationError(
                    `Group at index ${index}, leaf at index ${leafIndex} references unknown node "${leafId}"`, 
                    'groups'
                );
            }
        });
    });
}

/**
 * Validate dimensions
 */
export function validateDimensions(width: number, height: number): void {
    if (typeof width !== 'number' || width <= 0) {
        throw new RendererValidationError('Width must be a positive number', 'width');
    }
    
    if (typeof height !== 'number' || height <= 0) {
        throw new RendererValidationError('Height must be a positive number', 'height');
    }
    
    if (width > 10000 || height > 10000) {
        throw new RendererValidationError('Dimensions should not exceed 10000 pixels', 'dimensions');
    }
}

/**
 * Validate renderer config
 */
export function validateConfig(config: RendererConfig): void {
    if (typeof config.scaleFactor !== 'number' || config.scaleFactor <= 0) {
        throw new RendererValidationError('Scale factor must be a positive number', 'config.scaleFactor');
    }
    
    if (config.scaleFactor > 20) {
        throw new RendererValidationError('Scale factor should not exceed 20', 'config.scaleFactor');
    }
    
    if (config.onScaleFactorChange && typeof config.onScaleFactorChange !== 'function') {
        throw new RendererValidationError('onScaleFactorChange must be a function', 'config.onScaleFactorChange');
    }
}

/**
 * Validate dependencies
 */
export function validateDependencies(dependencies: LayoutDependencies): void {
    if (!dependencies.svgElement) {
        throw new RendererValidationError('SVG element is required', 'dependencies.svgElement');
    }
    
    if (!dependencies.config) {
        throw new RendererValidationError('Config is required', 'dependencies.config');
    }
    
    validateConfig(dependencies.config);
    
    if (dependencies.scaleFactorInput && typeof dependencies.scaleFactorInput.addEventListener !== 'function') {
        throw new RendererValidationError('Scale factor input must be a valid HTML input element', 'dependencies.scaleFactorInput');
    }
}

/**
 * Validate all inputs for the setupLayout function
 */
export function validateSetupLayoutInputs(
    nodes: Node[],
    edges: Edge[],
    constraints: Constraint[],
    groups: Group[],
    width: number,
    height: number,
    dependencies: LayoutDependencies
): void {
    validateNodes(nodes);
    validateEdges(edges, nodes);
    validateConstraints(constraints);
    validateGroups(groups, nodes);
    validateDimensions(width, height);
    validateDependencies(dependencies);
}

/**
 * Create a detailed error report for validation failures
 */
export function createValidationReport(
    nodes: Node[],
    edges: Edge[],
    constraints: Constraint[],
    groups: Group[],
    width: number,
    height: number,
    dependencies: LayoutDependencies
): { isValid: boolean; errors: RendererValidationError[]; warnings: string[] } {
    const errors: RendererValidationError[] = [];
    const warnings: string[] = [];
    
    try {
        validateSetupLayoutInputs(nodes, edges, constraints, groups, width, height, dependencies);
    } catch (error) {
        if (error instanceof RendererValidationError) {
            errors.push(error);
        }
    }
    
    // Add warnings for potential issues
    if (nodes.length > 1000) {
        warnings.push('Large number of nodes (>1000) may impact performance');
    }
    
    if (edges.length > 2000) {
        warnings.push('Large number of edges (>2000) may impact performance');
    }
    
    if (dependencies.config.scaleFactor > 10) {
        warnings.push('High scale factor may cause layout issues');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
