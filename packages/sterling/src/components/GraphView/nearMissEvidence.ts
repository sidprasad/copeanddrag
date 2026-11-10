import type { NearMissFormula, NearMissViolation } from '@/sterling-connection';

export function formulaLabel({ text, predicate, file, line }: NearMissFormula): string {
  const label = predicate ? `${predicate}: ${text}` : text;
  const filename = file && file.split(/[\\/]/).pop();
  return filename && line ? `${filename}:${line} · ${label}` : label;
}

const required = { lone: 'at most one', one: 'exactly one', no: 'zero', some: 'at least one' };

/** Explain and highlight the same binding and the same sample of its tuples. */
export function presentViolation({ cases }: NearMissViolation) {
  const lines: string[] = [];
  const atoms = new Set<string>();
  const edges: { relation: string; source: string; target: string }[] = [];
  const example = cases[0];
  if (example) {
    if (example.bindings.length) {
      const bindings = example.bindings.map(({ variable, atom }) => {
        atoms.add(String(atom));
        return `${variable} = ${atom}`;
      });
      lines.push(bindings.join(', '));
    }
    for (const { expression, value, multiplicity, relation, tuples } of example.evaluations) {
      if (!Array.isArray(value)) {
        lines.push(`${expression} = ${value}`);
        continue;
      }
      const shown = value.slice(0, 8);
      const sample = shown.map(row => row.join(' → ')).join(', ');
      const count = value.length > shown.length ? ` (first ${shown.length} of ${value.length} tuples)` : '';
      lines.push(`${expression} = {${sample}}${count}`);
      if (multiplicity) {
        const noun = value.length === 1 ? 'tuple' : 'tuples';
        lines.push(`The expression contains ${value.length} ${noun}. ${multiplicity} requires ${required[multiplicity]}.`);
      }
      for (const row of shown) {
        for (const atom of row) atoms.add(String(atom));
      }
      for (const row of tuples?.slice(0, shown.length) ?? []) {
        for (const atom of row) atoms.add(String(atom));
        if (relation && row.length === 2) {
          edges.push({ relation, source: String(row[0]), target: String(row[1]) });
        }
      }
    }
    if (cases.length > 1) lines.push(`Showing one of ${cases.length} bindings.`);
  }
  return { lines, atoms: [...atoms], edges };
}
