import { describe, expect, it } from '@jest/globals';
import * as yaml from 'js-yaml';
import { parseCndFile } from '../cndPreParser';
import {
  getCndSpecProjections,
  updateCndSpecProjections,
  updateCndSpecTemporalPolicy
} from '../cndSpecMutations';

describe('CnD full-document mutations', () => {
  it('adds a projection to the live draft without dropping inferred projections', () => {
    const draft = [
      'constraints:',
      '  - orientation:',
      '      selector: edge',
      '      directions: [below]',
      'projections:',
      '  - sig: State',
      '    orderBy: next',
      'temporal:',
      '  policy: stability',
      ''
    ].join('\n');

    const current = getCndSpecProjections(draft);
    const updated = updateCndSpecProjections(draft, [
      ...current,
      { type: 'Snapshot' }
    ]);

    expect(parseCndFile(updated).projections).toEqual([
      { type: 'State', orderBy: 'next' },
      { type: 'Snapshot' }
    ]);
    expect(yaml.load(updated)).toEqual(
      expect.objectContaining({
        constraints: expect.any(Array),
        temporal: { policy: 'stability' }
      })
    );
  });

  it('updates temporal policy from the draft without dropping projections', () => {
    const draft = [
      'directives:',
      '  - flag: hideDisconnectedBuiltIns',
      'projections:',
      '  - sig: State',
      'sequence:',
      '  policy: change_emphasis',
      ''
    ].join('\n');

    const updated = updateCndSpecTemporalPolicy(draft, 'stability');
    expect(yaml.load(updated)).toEqual({
      directives: [{ flag: 'hideDisconnectedBuiltIns' }],
      projections: [{ sig: 'State' }],
      temporal: { policy: 'stability' }
    });
  });

  it('preserves an intentionally empty document', () => {
    expect(updateCndSpecProjections('', [])).toBe('');
    expect(updateCndSpecTemporalPolicy('', 'ignore_history')).toBe('');
  });

  it('refuses to overwrite malformed draft YAML', () => {
    expect(() => updateCndSpecProjections('constraints: [', [])).toThrow();
    expect(() =>
      updateCndSpecTemporalPolicy('constraints: [', 'stability')
    ).toThrow();
  });
});
