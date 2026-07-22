import { describe, expect, it } from '@jest/globals';
import { parseLlmReply } from '../parse';

const GOOD = {
  interpretation: 'Children below parents.',
  clarification: null,
  candidates: [
    {
      rationale: 'left+right pairs parents with children',
      confidence: 'high',
      patch: {
        constraints: [
          { orientation: { selector: 'left + right', directions: ['above'] } }
        ]
      }
    }
  ]
};

describe('parseLlmReply', () => {
  it('accepts a well-formed reply', () => {
    const parsed = parseLlmReply(GOOD);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.response.candidates).toHaveLength(1);
      expect(parsed.response.clarification).toBeNull();
    }
  });

  it('passes a clarification through, with or without candidates', () => {
    const parsed = parseLlmReply({
      interpretation: 'Ambiguous.',
      clarification: 'Which relation defines the tree?'
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.response.clarification).toBe(
        'Which relation defines the tree?'
      );
      expect(parsed.response.candidates).toEqual([]);
    }
  });

  it('rejects a reply with no candidates and no clarification', () => {
    const parsed = parseLlmReply({
      interpretation: 'ok',
      candidates: []
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.problems.some((p) => p.includes('at least one candidate'))).toBe(
        true
      );
    }
  });

  it('rejects non-object replies', () => {
    expect(parseLlmReply([1, 2]).ok).toBe(false);
    expect(parseLlmReply('text').ok).toBe(false);
  });

  it('reports all problems across candidates, keeping the clean ones', () => {
    const parsed = parseLlmReply({
      interpretation: 'ok',
      candidates: [
        { rationale: '', confidence: 'very-high', patch: [] },
        GOOD.candidates[0]
      ]
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.problems.some((p) => p.includes('candidates[0].rationale'))).toBe(true);
      expect(parsed.problems.some((p) => p.includes('candidates[0].confidence'))).toBe(true);
      expect(parsed.problems.some((p) => p.includes('candidates[0].patch'))).toBe(true);
      expect(parsed.problems.some((p) => p.includes('candidates[1]'))).toBe(false);
    }
  });
});
