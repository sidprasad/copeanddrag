/**
 * Unit tests for validation utility functions
 */
import {
    validateNodes,
    validateEdges,
    validateConfig,
    validateDependencies,
    validateSetupLayoutInputs,
    createValidationReport,
    RendererValidationError
} from '../validation';
import { Node, Edge, RendererConfig, LayoutDependencies, Constraint, Group } from '../types';

// Mock D3 selection for testing
const mockSVGSelection = {
    node: jest.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
} as any;

describe('Validation Utils', () => {
    describe('validateNodes', () => {
        it('should validate correct nodes array', () => {
            const nodes: Node[] = [
                { id: 'node1', name: 'Test Node 1' },
                { id: 'node2', name: 'Test Node 2' }
            ];

            expect(() => validateNodes(nodes)).not.toThrow();
        });

        it('should throw for empty nodes array', () => {
            expect(() => validateNodes([]))
                .toThrow(RendererValidationError);
        });

        it('should throw for non-array input', () => {
            expect(() => validateNodes('not an array' as any))
                .toThrow('Nodes must be an array');
        });

        it('should throw for node without id', () => {
            const nodes = [{ name: 'Test Node' }] as Node[];

            expect(() => validateNodes(nodes))
                .toThrow('Node at index 0 must have an id');
        });

        it('should throw for duplicate node IDs', () => {
            const nodes: Node[] = [
                { id: 'node1', name: 'Node 1' },
                { id: 'node1', name: 'Node 2' }
            ];

            expect(() => validateNodes(nodes))
                .toThrow('Duplicate node id "node1" at index 1');
        });
    });

    describe('validateEdges', () => {
        const nodes: Node[] = [
            { id: 'node1' },
            { id: 'node2' }
        ];

        it('should validate correct edges array', () => {
            const edges: Edge[] = [
                {
                    id: 'edge1',
                    source: nodes[0],
                    target: nodes[1]
                }
            ];

            expect(() => validateEdges(edges, nodes)).not.toThrow();
        });

        it('should throw for non-array input', () => {
            expect(() => validateEdges('not an array' as any, nodes))
                .toThrow('Edges must be an array');
        });

        it('should throw for edge without id', () => {
            const edges = [
                {
                    source: nodes[0],
                    target: nodes[1]
                }
            ] as Edge[];

            expect(() => validateEdges(edges, nodes))
                .toThrow('Edge at index 0 must have an id');
        });

        it('should throw for edge with unknown source', () => {
            const edges: Edge[] = [
                {
                    id: 'edge1',
                    source: { id: 'unknown' } as Node,
                    target: nodes[1]
                }
            ];

            expect(() => validateEdges(edges, nodes))
                .toThrow('Edge "edge1" references unknown source node "unknown"');
        });
    });

    describe('validateConfig', () => {
        it('should validate correct config', () => {
            const config: RendererConfig = {
                scaleFactor: 1.5,
                performanceLogging: true
            };

            expect(() => validateConfig(config)).not.toThrow();
        });

        it('should throw for invalid scaleFactor', () => {
            const config: RendererConfig = {
                scaleFactor: 0
            };

            expect(() => validateConfig(config))
                .toThrow('Scale factor must be a positive number');
        });

        it('should throw for excessive scaleFactor', () => {
            const config: RendererConfig = {
                scaleFactor: 25
            };

            expect(() => validateConfig(config))
                .toThrow('Scale factor should not exceed 20');
        });
    });

    describe('validateDependencies', () => {
        const validConfig: RendererConfig = {
            scaleFactor: 1.0
        };

        it('should validate correct dependencies', () => {
            const deps: LayoutDependencies = {
                svgElement: mockSVGSelection,
                config: validConfig
            };

            expect(() => validateDependencies(deps)).not.toThrow();
        });

        it('should throw for missing svgElement', () => {
            const deps = {
                config: validConfig
            } as LayoutDependencies;

            expect(() => validateDependencies(deps))
                .toThrow('SVG element is required');
        });

        it('should throw for missing config', () => {
            const deps = {
                svgElement: mockSVGSelection
            } as LayoutDependencies;

            expect(() => validateDependencies(deps))
                .toThrow('Config is required');
        });
    });

    describe('validateSetupLayoutInputs', () => {
        const validNodes: Node[] = [{ id: 'node1' }];
        const validEdges: Edge[] = [];
        const validConstraints: Constraint[] = [];
        const validGroups: Group[] = [];
        const validDeps: LayoutDependencies = {
            svgElement: mockSVGSelection,
            config: { scaleFactor: 1.0 }
        };

        it('should validate all correct inputs', () => {
            expect(() => validateSetupLayoutInputs(
                validNodes,
                validEdges,
                validConstraints,
                validGroups,
                800,
                600,
                validDeps
            )).not.toThrow();
        });

        it('should throw for invalid dimensions', () => {
            expect(() => validateSetupLayoutInputs(
                validNodes,
                validEdges,
                validConstraints,
                validGroups,
                0,
                600,
                validDeps
            )).toThrow('Width must be a positive number');
        });
    });

    describe('createValidationReport', () => {
        it('should create report for valid inputs', () => {
            const validNodes: Node[] = [{ id: 'node1' }];
            const validEdges: Edge[] = [];
            const validConstraints: Constraint[] = [];
            const validGroups: Group[] = [];
            const validDeps: LayoutDependencies = {
                svgElement: mockSVGSelection,
                config: { scaleFactor: 1.0 }
            };

            const report = createValidationReport(
                validNodes,
                validEdges,
                validConstraints,
                validGroups,
                800,
                600,
                validDeps
            );

            expect(report.isValid).toBe(true);
            expect(report.errors).toHaveLength(0);
            expect(report.warnings).toHaveLength(0);
        });

        it('should include warnings for large datasets', () => {
            const manyNodes: Node[] = Array.from({ length: 1001 }, (_, i) => ({ id: `node${i}` }));
            const validDeps: LayoutDependencies = {
                svgElement: mockSVGSelection,
                config: { scaleFactor: 1.0 }
            };

            const report = createValidationReport(
                manyNodes,
                [],
                [],
                [],
                800,
                600,
                validDeps
            );

            expect(report.warnings).toContain('Large number of nodes (>1000) may impact performance');
        });
    });

    describe('RendererValidationError', () => {
        it('should be instance of Error', () => {
            const error = new RendererValidationError('Test error');
            expect(error).toBeInstanceOf(Error);
            expect(error.name).toBe('RendererValidationError');
            expect(error.message).toBe('Test error');
        });

        it('should support field property', () => {
            const error = new RendererValidationError('Test error', 'testField');
            expect(error.field).toBe('testField');
        });
    });
});
