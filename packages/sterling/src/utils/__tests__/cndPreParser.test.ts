import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as yaml from 'js-yaml';
import { parseCndFile } from '../cndPreParser';

describe('parseCndFile', () => {
  let warnSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('input shape handling', () => {
    it('returns defaults for empty input', () => {
      expect(parseCndFile('')).toEqual({
        projections: [],
        sequence: { policy: 'ignore_history' },
        layoutYaml: ''
      });
    });

    it('returns defaults for whitespace-only input', () => {
      expect(parseCndFile('   \n\t  ')).toEqual({
        projections: [],
        sequence: { policy: 'ignore_history' },
        layoutYaml: ''
      });
    });

    it('passes scalar (non-object) YAML through as raw layoutYaml', () => {
      const r = parseCndFile('hello');
      expect(r.projections).toEqual([]);
      expect(r.sequence.policy).toBe('ignore_history');
      expect(r.layoutYaml).toBe('hello');
    });
  });

  describe('projections extraction', () => {
    it('extracts an array of projection objects', () => {
      const r = parseCndFile(
        'projections:\n  - sig: State\n    orderBy: next\n  - sig: Time\n'
      );
      expect(r.projections).toEqual([
        { type: 'State', orderBy: 'next' },
        { type: 'Time' }
      ]);
    });

    it('accepts `type:` and `sig:` interchangeably and trims whitespace', () => {
      const r = parseCndFile(
        'projections:\n  - type: "  Foo  "\n  - sig: Bar\n'
      );
      expect(r.projections).toEqual([{ type: 'Foo' }, { type: 'Bar' }]);
    });

    it('handles singular `projection:` as an object', () => {
      const r = parseCndFile('projection:\n  sig: State\n');
      expect(r.projections).toEqual([{ type: 'State' }]);
    });

    it('skips entries with missing or empty type/sig and warns', () => {
      const r = parseCndFile(
        'projections:\n  - sig: State\n  - sig: ""\n  - {}\n'
      );
      expect(r.projections).toEqual([{ type: 'State' }]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('temporal / sequence policy', () => {
    it('parses the object form `temporal: { policy: stability }`', () => {
      const r = parseCndFile('temporal:\n  policy: stability\n');
      expect(r.sequence.policy).toBe('stability');
    });

    it('parses the bare-string shorthand `temporal: change_emphasis`', () => {
      const r = parseCndFile('temporal: change_emphasis');
      expect(r.sequence.policy).toBe('change_emphasis');
    });

    it('accepts `sequence:` as an alias for `temporal:`', () => {
      const r = parseCndFile('sequence:\n  policy: random_positioning\n');
      expect(r.sequence.policy).toBe('random_positioning');
    });

    it('falls back to ignore_history for an unknown policy and warns', () => {
      const r = parseCndFile('temporal:\n  policy: nonsense\n');
      expect(r.sequence.policy).toBe('ignore_history');
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('layoutYaml rebuild', () => {
    it('keeps only constraints + directives and strips the CND-only blocks', () => {
      const r = parseCndFile(
        'projections:\n  - sig: State\n' +
          'temporal: stability\n' +
          'constraints:\n  - orientation:\n      selector: friend\n      directions: [right]\n' +
          'directives:\n  - flag: hideDisconnectedBuiltIns\n'
      );
      const reparsed = yaml.load(r.layoutYaml) as Record<string, unknown>;
      expect(reparsed).toEqual({
        constraints: [
          { orientation: { selector: 'friend', directions: ['right'] } }
        ],
        directives: [{ flag: 'hideDisconnectedBuiltIns' }]
      });
      expect(reparsed.projections).toBeUndefined();
      expect(reparsed.temporal).toBeUndefined();
    });

    it('returns empty layoutYaml when no constraints/directives exist', () => {
      const r = parseCndFile('temporal: stability');
      expect(r.layoutYaml).toBe('');
    });
  });
});
