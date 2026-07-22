/**
 * Prompt assembly for NL layout authoring.
 *
 * The language reference below is a DISTILLATION of docs/cnd/yaml-spec.md —
 * update both together. It deliberately omits the legacy forms (atomColor,
 * edgeColor) so the model never learns them, and states the closed vocabulary
 * that cndVocabulary.ts enforces; a unit test asserts every vocabulary key
 * appears here so the two cannot drift silently.
 */

import type { LlmMessage, NlFinding } from './types';

export const CND_LANGUAGE_REFERENCE = `You translate natural-language layout intents into CnD layout specification patches. CnD lays out diagrams of relational data instances (Alloy/Forge-style: sigs with atoms, fields as tuple sets).

## Selectors
Selectors are relational expressions over the instance:
- \`TypeName\` — all atoms of a type (e.g. \`Person\`)
- \`fieldName\` — all tuples of a field (e.g. \`parent\`)
- \`a.b\` join, \`a + b\` union, \`a & b\` intersection, \`a - b\` difference
- \`~f\` transpose (reverse the pairs), \`^f\` transitive closure, \`*f\` reflexive closure, \`a -> b\` product
Prefer bare field/sig names. Use \`+\` for unions like \`left + right\`; use \`~parent\` when the data points child-to-parent but the layout intent is parent-to-child.

## Constraints (structural layout) — the ONLY constraint keys are: orientation, cyclic, align, group, size, hideAtom
- orientation: {selector: <binary: source->target pairs>, directions: [above|below|left|right|directlyAbove|directlyBelow|directlyLeft|directlyRight]}
  "directions" positions the TARGET relative to the SOURCE: for (parent, child) pairs in \`children\`, \`selector: children, directions: [below]\` puts each child below its parent. For a child->parent field like \`boss\`, \`selector: boss, directions: [above]\` puts each boss above their report (or use \`~boss\` with [below]).
  Restrictions: above cannot combine with below; left cannot combine with right; directly* combines only with its plain counterpart.
- cyclic: {selector: <binary>, direction: clockwise|counterclockwise} — arrange along a circle.
- align: {selector: <atoms or pairs>, direction: horizontal|vertical}
- group (by selector): {selector: <atoms>, name: "<label>", addEdge: true|false}
- group (by field): {field: <field name>, groupOn: <tuple index>, addToGroup: <tuple index>, selector: <optional unary filter>}
- size: {selector: <unary>, width: <px>, height: <px>}
- hideAtom: {selector: <unary>}
Any constraint may add \`hold: never\` to assert it must NEVER hold (no double negation).

## Directives (presentation only) — the ONLY directive keys are: atomStyle, edgeStyle, icon, attribute, tag, hideField, hideAtom, inferredEdge, flag
- atomStyle: {selector: <unary, optional>, shape: <shape>, fillStyle: {color}, borderStyle: {color, width}, textStyle: {color}}
- edgeStyle: {field: <field name>, selector: <optional unary source filter>, filter: <optional tuple filter>, lineStyle: {color, pattern, weight, highlight}, textStyle: {color}, showLabel: bool, hidden: bool}
- icon: {selector: <unary>, path: <icon name or path>, showLabels: bool}
- attribute: {field: <field name>, selector: <optional>, filter: <optional>} — removes the edge, shows the value on the node instead. Ideal for scalar fields like val/age/name.
- tag: {toTag: <unary>, name: <label>, value: <selector>} — computed attribute; keeps edges.
- hideField: {field: <field name>, selector: <optional>, filter: <optional>}
- hideAtom: {selector: <unary>}
- inferredEdge: {name: <label>, selector: <binary>, color, style: solid|dashed|dotted, weight} — draw edges that are not in the data (e.g. \`^parent\`).
- flag: hideDisconnected | hideDisconnectedBuiltIns — written as \`- flag: hideDisconnected\` (a bare string value).

Note: \`field:\` values are field NAMES from the schema, not expressions; \`selector:\`/\`filter:\`/\`value:\`/\`toTag:\` values are expressions.`;

export const RESPONSE_FORMAT_INSTRUCTIONS = `Reply with a single JSON object:
{
  "interpretation": "<one sentence restating the intent>",
  "clarification": null | "<a question, ONLY if the intent is too ambiguous to translate>",
  "candidates": [
    {
      "rationale": "<why this patch expresses the intent>",
      "confidence": "high" | "medium" | "low",
      "patch": {"constraints": [...], "directives": [...]},
      "fallbacks": [<zero or more progressively weaker whole patches, strongest first>]
    }
  ]
}
Patches are JSON versions of CnD YAML entries, e.g. {"orientation": {"selector": "left + right", "directions": ["below"]}}. Emit 1–3 candidates. Do not duplicate constraints the user already has. Prefer one strong candidate with fallbacks over many similar candidates.`;

/**
 * JSON Schema for the reply — handed to providers so schema-native backends
 * can enforce it; text backends get it embedded by withJsonInstruction.
 * CndPatch internals stay loose here: the vocabulary gate does the real check
 * and produces better feedback than a schema validator would.
 */
export const RESPONSE_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    interpretation: { type: 'string' },
    clarification: { type: ['string', 'null'] },
    candidates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rationale: { type: 'string' },
          confidence: { enum: ['high', 'medium', 'low'] },
          patch: {
            type: 'object',
            properties: {
              constraints: { type: 'array', items: { type: 'object' } },
              directives: { type: 'array', items: { type: 'object' } }
            },
            additionalProperties: false
          },
          fallbacks: { type: 'array', items: { type: 'object' } }
        },
        required: ['rationale', 'confidence', 'patch'],
        additionalProperties: false
      }
    }
  },
  required: ['interpretation', 'candidates'],
  additionalProperties: false
};

/**
 * Few-shot pairs. The first mirrors demos/bst (the canonical utterance); the
 * second exercises directives. These double as canned fixtures in tests.
 */
export const FEW_SHOT_MESSAGES: LlmMessage[] = [
  {
    role: 'user',
    content: `Schema:
sig Tree { val: Int, left: Tree, right: Tree }

Intent: "All binary tree children should be below their parents"`
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      interpretation:
        'Every node reached via left or right should be positioned below the node it hangs off.',
      clarification: null,
      candidates: [
        {
          rationale:
            'left + right pairs each parent with its children; directions position the child (target) below the parent (source).',
          confidence: 'high',
          patch: {
            constraints: [
              {
                orientation: {
                  selector: 'left + right',
                  directions: ['below']
                }
              }
            ]
          },
          fallbacks: [
            {
              constraints: [
                { orientation: { selector: 'left', directions: ['below'] } },
                { orientation: { selector: 'right', directions: ['below'] } }
              ]
            }
          ]
        }
      ]
    })
  },
  {
    role: 'user',
    content: `Schema:
sig Person { age: Int, spouse: Person }

Intent: "show ages on the nodes and make married people green"`
  },
  {
    role: 'assistant',
    content: JSON.stringify({
      interpretation:
        'Display each person’s age as a node attribute instead of an edge, and fill people with a spouse in green.',
      clarification: null,
      candidates: [
        {
          rationale:
            'attribute folds the age edge into the node; spouse.Person is the join selecting exactly the people who have a spouse.',
          confidence: 'high',
          patch: {
            directives: [
              { attribute: { field: 'age' } },
              {
                atomStyle: {
                  selector: 'spouse.Person',
                  fillStyle: { color: 'green' }
                }
              }
            ]
          },
          fallbacks: [
            {
              directives: [
                { attribute: { field: 'age' } },
                { atomStyle: { selector: 'Person', fillStyle: { color: 'green' } } }
              ]
            }
          ]
        }
      ]
    })
  }
];

export interface SystemPromptOptions {
  schemaSummary: string;
  /** The spec already in the editor; '' when starting fresh. */
  currentSpec: string;
}

export function buildSystemPrompt(options: SystemPromptOptions): string {
  const sections = [
    CND_LANGUAGE_REFERENCE,
    RESPONSE_FORMAT_INSTRUCTIONS,
    `# Current instance\n${options.schemaSummary}`
  ];
  if (options.currentSpec.trim()) {
    sections.push(
      `# Current spec\nThe user already has this spec; add to it, do not duplicate or contradict it:\n${options.currentSpec.trim()}`
    );
  }
  return sections.join('\n\n');
}

/** The initial conversation for a translate call. */
export function buildTranslateMessages(
  systemPrompt: string,
  utterance: string
): LlmMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...FEW_SHOT_MESSAGES,
    { role: 'user', content: `Intent: ${JSON.stringify(utterance)}` }
  ];
}

/**
 * The repair message for a follow-up call: enumerate every finding and re-ask
 * in the same format. Findings carry oracle reasons verbatim — that precision
 * is what makes the loop converge.
 */
export function buildRepairMessage(findings: readonly NlFinding[]): string {
  const lines = findings.map((finding) => {
    const where =
      finding.candidateIndex >= 0
        ? `Candidate ${finding.candidateIndex + 1}`
        : 'Response';
    return `- ${where}: ${finding.message}`;
  });
  return `Your previous answer has problems:\n${lines.join('\n')}\n\nRespond with a corrected JSON object in the same format. Keep what was right; fix only what is flagged.`;
}
