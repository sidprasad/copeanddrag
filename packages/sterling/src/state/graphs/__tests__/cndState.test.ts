import { describe, expect, it } from '@jest/globals';
import type { DatumParsed } from '@/sterling-connection';
import reducer, { cndDraftSpecSet, cndSpecSet } from '../graphsSlice';
import graphsSelectors from '../graphsSelectors';
import { newGraphsState } from '../graphs';

const datum = {
  id: 'datum-1',
  generatorName: 'example-model'
} as DatumParsed<any>;

describe('CnD applied/draft state', () => {
  it('keeps an explicitly empty draft instead of falling back to applied text', () => {
    const state = newGraphsState();
    state.cndSpecByGeneratorName['example-model'] =
      'directives:\n  - flag: hideDisconnectedBuiltIns';

    const cleared = reducer(state, cndDraftSpecSet({ datum, spec: '' }));

    expect(graphsSelectors.selectCnDDraftSpec(cleared, datum)).toBe('');
  });

  it('atomically synchronizes every applied spec write into the editor draft', () => {
    const state = newGraphsState();
    state.cndDraftSpecByGeneratorName['example-model'] =
      'temporal:\n  policy: stability';
    const applied = [
      'projections:',
      '  - sig: State',
      'temporal:',
      '  policy: change_emphasis',
      ''
    ].join('\n');

    const next = reducer(state, cndSpecSet({ datum, spec: applied }));

    expect(next.cndSpecByGeneratorName['example-model']).toBe(applied);
    expect(next.cndDraftSpecByGeneratorName['example-model']).toBe(applied);
    expect(next.projectionConfigByGeneratorName['example-model']).toEqual([
      { type: 'State' }
    ]);
    expect(next.sequencePolicyByGeneratorName['example-model']).toBe(
      'change_emphasis'
    );
  });
});
