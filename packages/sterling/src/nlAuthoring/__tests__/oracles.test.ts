import { describe, expect, it } from '@jest/globals';
import { collectPatchFindings, mergeSpecWithPatch } from '../oracles';
import { FAKE_INSTANCE, fakeCore } from '../testSupport/fakes';

const DEPS = { core: fakeCore(), instances: [FAKE_INSTANCE] };

describe('mergeSpecWithPatch', () => {
  it('appends to existing sections and preserves foreign blocks', () => {
    const current = [
      'projections:',
      '  - sig: State',
      'constraints:',
      '  - align: {selector: Tree, direction: horizontal}'
    ].join('\n');
    const merged = mergeSpecWithPatch(current, {
      constraints: [
        { orientation: { selector: 'left', directions: ['above'] } }
      ],
      directives: [{ attribute: { field: 'val' } }]
    });
    expect(merged).toContain('sig: State');
    expect(merged).toContain('align');
    expect(merged).toContain('orientation');
    expect(merged).toContain('attribute');
  });

  it('drops exact duplicates', () => {
    const current = 'constraints:\n  - orientation: {selector: left, directions: [above]}\n';
    const merged = mergeSpecWithPatch(current, {
      constraints: [
        { orientation: { selector: 'left', directions: ['above'] } }
      ]
    });
    expect(merged.match(/orientation/g)).toHaveLength(1);
  });

  it('returns the patch alone over an empty current spec', () => {
    const merged = mergeSpecWithPatch('', {
      directives: [{ flag: 'hideDisconnected' }]
    });
    expect(merged).toContain('flag: hideDisconnected');
  });
});

describe('collectPatchFindings', () => {
  it('is silent on a clean patch', () => {
    expect(
      collectPatchFindings(
        0,
        {
          constraints: [
            { orientation: { selector: 'left + right', directions: ['above'] } }
          ]
        },
        DEPS
      )
    ).toEqual([]);
  });

  it('stops at vocabulary problems without running the oracles', () => {
    const findings = collectPatchFindings(
      0,
      { constraints: [{ orient: { selector: 'lft' } }] },
      DEPS
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.stage).toBe('vocabulary');
  });

  it('flags unknown field NAMES against the schema', () => {
    const findings = collectPatchFindings(
      0,
      { directives: [{ attribute: { field: 'lft' } }] },
      DEPS
    );
    expect(findings.some(({ message }) => message.includes('Known fields'))).toBe(
      true
    );
  });

  it('flags evaluation failures with the evaluator message', () => {
    const findings = collectPatchFindings(
      0,
      {
        constraints: [{ orientation: { selector: 'lft', directions: ['above'] } }]
      },
      DEPS
    );
    expect(findings.some(({ message }) => message.includes('NameNotFoundError'))).toBe(
      true
    );
    expect(findings[0]!.severity).toBe('blocking');
  });

  it('warns (not blocks) on empty-everywhere selectors', () => {
    const findings = collectPatchFindings(
      0,
      {
        constraints: [
          { orientation: { selector: 'left & ~left', directions: ['above'] } }
        ]
      },
      DEPS
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]!.severity).toBe('warning');
    expect(findings[0]!.message).toContain('matches nothing');
  });

  it('flags arity mismatches for pair-consuming forms', () => {
    const findings = collectPatchFindings(
      0,
      {
        constraints: [{ orientation: { selector: 'Tree', directions: ['above'] } }]
      },
      DEPS
    );
    expect(findings.some(({ message }) => message.includes('arity'))).toBe(true);
  });
});
