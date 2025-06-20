/**
 * Unit tests for API convenience functions
 */

// Mock the setupLayout function first
jest.mock('../layout', () => ({
    setupLayout: jest.fn()
}));

// Mock D3 before importing anything
jest.mock('d3', () => ({
    select: jest.fn()
}));

import {
    setupLayoutFromDOM,
    createRendererConfig,
    setupLayoutWithConfig
} from '../api';
import { Node, Edge, Constraint, Group, RendererConfig } from '../types';
import { setupLayout } from '../layout';
import * as d3 from 'd3';

const mockSetupLayout = setupLayout as jest.MockedFunction<typeof setupLayout>;
const mockD3Select = d3.select as jest.MockedFunction<typeof d3.select>;

// Mock DOM methods
Object.defineProperty(global, 'document', {
    value: {
        getElementById: jest.fn(),
        createElementNS: jest.fn(() => ({}))
    }
});

describe('API Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createRendererConfig', () => {
        it('should create config with default values', () => {
            const config = createRendererConfig();
            
            expect(config.scaleFactor).toBe(5);
            expect(config.performanceLogging).toBe(false);
            expect(config.enableGridSnap).toBe(true);
            expect(config.enableOverlapMinimization).toBe(true);
            expect(config.onScaleFactorChange).toBeUndefined();
        });

        it('should create config with custom scale factor', () => {
            const config = createRendererConfig(2.5);
            
            expect(config.scaleFactor).toBe(2.5);
        });

        it('should create config with callback', () => {
            const callback = jest.fn();
            const config = createRendererConfig(3, callback);
            
            expect(config.scaleFactor).toBe(3);
            expect(config.onScaleFactorChange).toBe(callback);
        });

        it('should merge additional options', () => {
            const config = createRendererConfig(1, undefined, {
                performanceLogging: true,
                enableGridSnap: false
            });
            
            expect(config.scaleFactor).toBe(1);
            expect(config.performanceLogging).toBe(true);
            expect(config.enableGridSnap).toBe(false);
            expect(config.enableOverlapMinimization).toBe(true);
        });
    });

    describe('setupLayoutWithConfig', () => {
        const mockSVGSelection = {
            node: jest.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
        } as any;

        const sampleNodes: Node[] = [{ id: 'node1' }];
        const sampleEdges: Edge[] = [];
        const sampleConstraints: Constraint[] = [];
        const sampleGroups: Group[] = [];
        const config: RendererConfig = { scaleFactor: 1.0 };

        it('should call setupLayout with correct parameters', () => {
            setupLayoutWithConfig(
                mockSVGSelection,
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                config
            );

            expect(mockSetupLayout).toHaveBeenCalledWith(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                {
                    svgElement: mockSVGSelection,
                    scaleFactorInput: undefined,
                    config
                }
            );
        });

        it('should include scale factor input when provided', () => {
            const mockInput = document.createElement('input');
            
            setupLayoutWithConfig(
                mockSVGSelection,
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                config,
                mockInput
            );

            expect(mockSetupLayout).toHaveBeenCalledWith(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                {
                    svgElement: mockSVGSelection,
                    scaleFactorInput: mockInput,
                    config
                }
            );
        });
    });

    describe('setupLayoutFromDOM', () => {
        const sampleNodes: Node[] = [{ id: 'node1' }];
        const sampleEdges: Edge[] = [];
        const sampleConstraints: Constraint[] = [];
        const sampleGroups: Group[] = [];

        beforeEach(() => {
            // Reset mocks
            (mockD3Select as any).mockReturnValue({
                empty: jest.fn(() => false),
                node: jest.fn(() => document.createElementNS('http://www.w3.org/2000/svg', 'svg'))
            });
            
            (document.getElementById as jest.Mock).mockReturnValue(
                document.createElement('input')
            );
        });

        it('should find SVG element and call setupLayout', () => {
            const mockSVGSelection = {
                empty: jest.fn(() => false),
                node: jest.fn()
            };
            (mockD3Select as any).mockReturnValue(mockSVGSelection);

            setupLayoutFromDOM(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600
            );

            expect(mockD3Select).toHaveBeenCalledWith('#svg');
            expect(document.getElementById).toHaveBeenCalledWith('scaleFactor');
            expect(mockSetupLayout).toHaveBeenCalled();
        });

        it('should throw error when SVG element not found', () => {
            (mockD3Select as any).mockReturnValue({
                empty: jest.fn(() => true)
            });

            expect(() => setupLayoutFromDOM(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600
            )).toThrow("SVG element with id 'svg' not found in DOM");
        });

        it('should use custom config when provided', () => {
            const mockSVGSelection = {
                empty: jest.fn(() => false),
                node: jest.fn()
            };
            (mockD3Select as any).mockReturnValue(mockSVGSelection);

            const customConfig = {
                scaleFactor: 2.5,
                performanceLogging: true
            };

            setupLayoutFromDOM(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                customConfig
            );

            expect(mockSetupLayout).toHaveBeenCalledWith(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                expect.objectContaining({
                    config: expect.objectContaining({
                        scaleFactor: 2.5,
                        performanceLogging: true,
                        enableGridSnap: true,
                        enableOverlapMinimization: true
                    })
                })
            );
        });

        it('should handle missing scale factor input element', () => {
            const mockSVGSelection = {
                empty: jest.fn(() => false),
                node: jest.fn()
            };
            (mockD3Select as any).mockReturnValue(mockSVGSelection);
            (document.getElementById as jest.Mock).mockReturnValue(null);

            setupLayoutFromDOM(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600
            );

            expect(mockSetupLayout).toHaveBeenCalledWith(
                sampleNodes,
                sampleEdges,
                sampleConstraints,
                sampleGroups,
                800,
                600,
                expect.objectContaining({
                    scaleFactorInput: undefined
                })
            );
        });
    });
});
