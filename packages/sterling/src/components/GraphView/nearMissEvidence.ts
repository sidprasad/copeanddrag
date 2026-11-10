import type { NearMissFormula, NearMissViolation } from '@/sterling-connection';

export function sourceLocation({ file, line }: NearMissFormula) {
  const filename = file && file.split(/[\\/]/).pop();
  return filename && line ? `${filename}:${line}` : undefined;
}

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
      const count = cases.length > 1 ? ` (1 of ${cases.length} bindings)` : '';
      lines.push(bindings.join(', ') + count);
    }
    for (const { expression, value, relation, tuples } of example.evaluations) {
      if (!Array.isArray(value)) {
        lines.push(`${expression} = ${value}`);
        continue;
      }
      const shown = value.slice(0, 8);
      const sample = shown.map(row => row.join(' → ')).join(', ');
      const omitted = value.length - shown.length;
      const suffix = omitted ? ` (+${omitted} more)` : '';
      lines.push(`${expression} = {${sample}}${suffix}`);
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
  }
  return { lines, atoms: [...atoms], edges };
}
