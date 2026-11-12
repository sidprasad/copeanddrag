import type { NearMissFormula, NearMissViolation } from '@/sterling-connection';

export function sourceLocation({ file, line }: NearMissFormula) {
  const filename = file && file.split(/[\\/]/).pop();
  return filename && line ? `${filename}:${line}` : undefined;
}

/** Explain and highlight the same binding and the same sample of its tuples. */
export function presentViolation({ cases }: NearMissViolation) {
  const atoms = new Set<string>();
  const edges: { relation: string; source: string; target: string }[] = [];
  const example = cases[0];
  const bindings = example?.bindings ?? [];
  for (const { atom } of bindings) atoms.add(String(atom));
  const evaluations = (example?.evaluations ?? []).map(
    ({ expression, value, relation, tuples, multiplicity }) => {
      if (!Array.isArray(value)) {
        return { expression, valueText: String(value), omitted: 0 };
      }
      const shown = value.slice(0, 8);
      for (const row of shown) {
        for (const atom of row) atoms.add(String(atom));
      }
      for (const row of tuples?.slice(0, shown.length) ?? []) {
        for (const atom of row) atoms.add(String(atom));
        if (relation && row.length === 2) {
          edges.push({
            relation,
            source: String(row[0]),
            target: String(row[1])
          });
        }
      }
      return {
        expression,
        // These are displayed relation values, using the instance's atom labels.
        // Keep truncation metadata out of the code: an abbreviated value is not
        // an equality with the complete evaluated expression.
        valueText: shown.length
          ? shown.map((row) => row.join(' -> ')).join(' + ')
          : 'none',
        omitted: value.length - shown.length,
        total: value.length,
        multiplicity,
        cardinality:
          value.length === 0
            ? 'This value is empty.'
            : `This value contains ${value.length} ${
                value[0].length === 1 ? 'atom' : 'tuple'
              }${value.length === 1 ? '' : 's'}.`
      };
    }
  );
  return {
    bindings,
    evaluations,
    caseCount: cases.length,
    atoms: [...atoms],
    edges
  };
}
