/**
 * Unit tests for renderer utility functions
 */
import {
    isInferredEdge,
    isGroupEdge,
    adjustLinkLengthsAndSeparationConstraintsToScaleFactor,
    getGroupOnAndAddToGroupIndices,
    getRandomOffsetAlongPath,
    calculateOverlapArea,
    getContainingGroups
} from '../utils';
import { Edge, Node, Constraint, Group, BoundingBox } from '../types';

describe('Renderer Utils', () => {
    describe('isInferredEdge', () => {
        it('should return true for inferred edges', () => {
            const edge: Edge = {
                id: 'some_inferred_edge_123',
                source: { id: 'node1' } as Node,
                target: { id: 'node2' } as Node
            };
            expect(isInferredEdge(edge)).toBe(true);
        });

        it('should return false for non-inferred edges', () => {
            const edge: Edge = {
                id: 'regular_edge_123',
                source: { id: 'node1' } as Node,
                target: { id: 'node2' } as Node
            };
            expect(isInferredEdge(edge)).toBe(false);
        });
    });

    describe('isGroupEdge', () => {
        it('should return true for group edges', () => {
            const edge: Edge = {
                id: '_g_1_2_edge',
                source: { id: 'node1' } as Node,
                target: { id: 'node2' } as Node
            };
            expect(isGroupEdge(edge)).toBe(true);
        });

        it('should return false for non-group edges', () => {
            const edge: Edge = {
                id: 'regular_edge',
                source: { id: 'node1' } as Node,
                target: { id: 'node2' } as Node
            };
            expect(isGroupEdge(edge)).toBe(false);
        });
    });

    describe('adjustLinkLengthsAndSeparationConstraintsToScaleFactor', () => {
        it('should scale separation constraints correctly', () => {
            const constraints: Constraint[] = [
                { type: 'separation', gap: 100 },
                { type: 'alignment' },
                { type: 'separation', gap: 50 }
            ];
            const scaleFactor = 10; // Will result in adjustedScaleFactor of 2

            const result = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor);

            expect(result.scaledConstraints).toHaveLength(3);
            expect(result.scaledConstraints[0].gap).toBe(50); // 100 / 2
            expect(result.scaledConstraints[1].gap).toBeUndefined(); // alignment constraint unchanged
            expect(result.scaledConstraints[2].gap).toBe(25); // 50 / 2
            expect(result.linkLength).toBeCloseTo(125); // (150 + 100) / 2
        });

        it('should calculate link length correctly', () => {
            const constraints: Constraint[] = [];
            const scaleFactor = 5; // Will result in adjustedScaleFactor of 1

            const result = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor);

            expect(result.linkLength).toBe(250); // (150 + 100) / 1
        });

        it('should handle constraints without gap property', () => {
            const constraints: Constraint[] = [
                { type: 'alignment' },
                { type: 'other', someProperty: 'value' }
            ];
            const scaleFactor = 5;

            const result = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor);

            expect(result.scaledConstraints).toHaveLength(2);
            expect(result.scaledConstraints[0]).toEqual({ type: 'alignment' });
            expect(result.scaledConstraints[1]).toEqual({ type: 'other', someProperty: 'value' });
        });
    });

    describe('getGroupOnAndAddToGroupIndices', () => {
        it('should parse group indices correctly', () => {
            const edgeId = '_g_3_7_edge';
            const result = getGroupOnAndAddToGroupIndices(edgeId);
            
            expect(result.groupOnIndex).toBe(3);
            expect(result.addToGroupIndex).toBe(7);
        });

        it('should handle different edge ID formats', () => {
            const edgeId = '_g_123_456_';
            const result = getGroupOnAndAddToGroupIndices(edgeId);
            
            expect(result.groupOnIndex).toBe(123);
            expect(result.addToGroupIndex).toBe(456);
        });

        it('should throw error for invalid format', () => {
            const edgeId = 'invalid_edge_id';
            
            expect(() => getGroupOnAndAddToGroupIndices(edgeId))
                .toThrow('Edge ID invalid_edge_id does not match the expected pattern.');
        });
    });

    describe('getRandomOffsetAlongPath', () => {
        it('should return number within expected range', () => {
            for (let i = 0; i < 100; i++) {
                const offset = getRandomOffsetAlongPath();
                expect(offset).toBeGreaterThanOrEqual(-10);
                expect(offset).toBeLessThanOrEqual(10);
            }
        });

        it('should return different values on multiple calls', () => {
            const offsets = Array.from({ length: 10 }, () => getRandomOffsetAlongPath());
            const uniqueOffsets = new Set(offsets);
            
            // Very unlikely that all 10 calls return the same value
            expect(uniqueOffsets.size).toBeGreaterThan(1);
        });
    });

    describe('calculateOverlapArea', () => {
        it('should calculate overlap area correctly', () => {
            const bbox1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
            const bbox2: BoundingBox = { x: 5, y: 5, width: 10, height: 10 };
            
            const area = calculateOverlapArea(bbox1, bbox2);
            expect(area).toBe(25); // 5x5 overlap
        });

        it('should return 0 for non-overlapping boxes', () => {
            const bbox1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
            const bbox2: BoundingBox = { x: 20, y: 20, width: 10, height: 10 };
            
            const area = calculateOverlapArea(bbox1, bbox2);
            expect(area).toBe(0);
        });

        it('should handle touching edges (no overlap)', () => {
            const bbox1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
            const bbox2: BoundingBox = { x: 10, y: 0, width: 10, height: 10 };
            
            const area = calculateOverlapArea(bbox1, bbox2);
            expect(area).toBe(0);
        });

        it('should handle complete overlap', () => {
            const bbox1: BoundingBox = { x: 0, y: 0, width: 10, height: 10 };
            const bbox2: BoundingBox = { x: 2, y: 2, width: 6, height: 6 };
            
            const area = calculateOverlapArea(bbox1, bbox2);
            expect(area).toBe(36); // 6x6 (smaller box completely inside)
        });
    });

    describe('getContainingGroups', () => {
        const node1: Node = { id: 'node1' };
        const node2: Node = { id: 'node2' };
        const node3: Node = { id: 'node3' };
        
        const group1: Group = {
            id: 'group1',
            leaves: [node1, node2]
        };
        
        const group2: Group = {
            id: 'group2', 
            leaves: [node3]
        };

        it('should find groups containing a node', () => {
            const groups = [group1, group2];
            const result = getContainingGroups(groups, node1);
            
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('group1');
        });

        it('should return empty array for node not in any group', () => {
            const node4: Node = { id: 'node4' };
            const groups = [group1, group2];
            const result = getContainingGroups(groups, node4);
            
            expect(result).toHaveLength(0);
        });

        it('should handle empty groups array', () => {
            const result = getContainingGroups([], node1);
            expect(result).toHaveLength(0);
        });
    });
});
