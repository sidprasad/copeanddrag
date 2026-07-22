import { describe, expect, it } from '@jest/globals';
import {
  CONSTRAINT_KEYS,
  CYCLIC_ROTATIONS,
  DIRECTIVE_KEYS,
  FLAG_NAMES,
  ORIENTATION_DIRECTIONS
} from '../cndVocabulary';
import {
  CND_LANGUAGE_REFERENCE,
  FEW_SHOT_MESSAGES,
  buildRepairMessage,
  buildSystemPrompt,
  buildTranslateMessages
} from '../prompt';
import { parseLlmReply } from '../parse';
import { validatePatch } from '../cndVocabulary';

describe('vocabulary drift', () => {
  // The reference is a hand-distilled copy of docs/cnd/yaml-spec.md; these
  // assertions force it to keep pace with the enforcement tables.
  it('mentions every constraint and directive key', () => {
    for (const key of [...CONSTRAINT_KEYS, ...DIRECTIVE_KEYS]) {
      expect(CND_LANGUAGE_REFERENCE).toContain(key);
    }
  });

  it('mentions every direction, rotation, and flag value', () => {
    for (const value of [
      ...ORIENTATION_DIRECTIONS,
      ...CYCLIC_ROTATIONS,
      ...FLAG_NAMES
    ]) {
      expect(CND_LANGUAGE_REFERENCE).toContain(value);
    }
  });

  it('never teaches the legacy or builder-internal names', () => {
    for (const banned of ['atomColor', 'edgeColor', 'groupfield', 'groupselector']) {
      expect(CND_LANGUAGE_REFERENCE).not.toContain(banned);
    }
  });
});

describe('few-shot examples', () => {
  it('every assistant example parses and validates cleanly', () => {
    const assistants = FEW_SHOT_MESSAGES.filter(
      ({ role }) => role === 'assistant'
    );
    expect(assistants.length).toBeGreaterThan(0);
    for (const message of assistants) {
      const parsed = parseLlmReply(JSON.parse(message.content));
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      for (const candidate of parsed.response.candidates) {
        expect(validatePatch(candidate.patch)).toEqual([]);
        for (const fallback of candidate.fallbacks ?? []) {
          expect(validatePatch(fallback)).toEqual([]);
        }
      }
    }
  });
});

describe('message assembly', () => {
  it('includes schema, current spec, and the utterance', () => {
    const system = buildSystemPrompt({
      schemaSummary: 'sig Tree { left: Tree }',
      currentSpec: 'constraints:\n  - align: {selector: Tree, direction: horizontal}'
    });
    expect(system).toContain('sig Tree');
    expect(system).toContain('do not duplicate');
    const messages = buildTranslateMessages(system, 'children below parents');
    expect(messages[0]!.role).toBe('system');
    expect(messages[messages.length - 1]!.content).toContain(
      'children below parents'
    );
  });

  it('omits the current-spec section when the editor is empty', () => {
    expect(
      buildSystemPrompt({ schemaSummary: 's', currentSpec: '  ' })
    ).not.toContain('# Current spec');
  });

  it('repair messages carry findings verbatim with candidate labels', () => {
    const message = buildRepairMessage([
      {
        candidateIndex: 0,
        severity: 'blocking',
        stage: 'evaluation',
        message: 'selector `lft` failed: name not found'
      },
      {
        candidateIndex: -1,
        severity: 'blocking',
        stage: 'shape',
        message: '"interpretation" must be a non-empty string.'
      }
    ]);
    expect(message).toContain('Candidate 1: selector `lft` failed');
    expect(message).toContain('Response: "interpretation"');
    expect(message).toContain('same format');
  });
});
