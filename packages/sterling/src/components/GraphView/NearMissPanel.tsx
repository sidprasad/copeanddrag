import { Button } from '@chakra-ui/react';
import { buttonClicked, type Datum, type NearMissFormula } from '@/sterling-connection';
import { useEffect, useState } from 'react';
import { activeDatumSet } from '../../state/data/dataSlice';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectIsConnected } from '../../state/selectors';
import { presentViolation, sourceLocation } from './nearMissEvidence';

function RuleText({ formula }: { formula: NearMissFormula }) {
  return <code className="break-words text-sm text-ink">
    {formula.predicate && <><strong className="mr-1">{formula.predicate}</strong>{' '}</>}
    <span className={formula.predicate ? 'text-ink-muted' : undefined}>{formula.text}</span>
  </code>;
}

export function NearMissPanel({ datum }: { datum: Datum }) {
  const dispatch = useSterlingDispatch();
  const connected = useSterlingSelector(selectIsConnected);
  const [keep, setKeep] = useState<number[]>([]);
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (!connected) setRequested(false);
  }, [connected]);
  const options = datum.nearMissOptions;
  const report = datum.nearMiss;
  const waiting = requested && !datum.diagnosticError;
  const request = () => {
    const last = report?.violations ? report : undefined;
    setRequested(true);
    dispatch(buttonClicked({
      id: datum.id, onClick: 'near-miss',
      context: {
        generatorName: datum.generatorName,
        originalId: last?.originalId ?? datum.id,
        keep: last?.keep ?? keep,
        previous: last?.previous ?? []
      }
    }));
  };
  if (report) {
    return (
      <section aria-label="Near miss explanation" className="max-h-[40%] overflow-auto border-b border-rule bg-surface px-4 py-2 text-sm text-ink">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <h2 className="m-0 text-sm font-semibold leading-tight">{report.violations ? 'These rules were dropped' : 'UNSAT with these rules fixed'}</h2>
          <div className="flex items-center gap-2">
            {report.violations && report.more === 'available' && (
              <Button size="xs" isDisabled={waiting || !connected} onClick={request}>
                {waiting ? 'Searching…' : 'Another explanation'}
              </Button>
            )}
            <Button size="xs" variant="ghost" onClick={() => dispatch(activeDatumSet(report.originalId))}>Back to UNSAT</Button>
          </div>
        </div>
        {report.violations && <ul className="m-0 mt-1 list-none divide-y divide-rule p-0">
          {report.violations.map((v, i) => {
            const { lines } = presentViolation(v);
            const location = sourceLocation(v.formula);
            return <li key={i} className="py-1">
              {lines.length > 0 || location ? <details>
                <summary className="cursor-pointer"><RuleText formula={v.formula} /></summary>
                <div className="ml-4 mt-1 border-l border-rule pl-3 text-xs text-ink-muted">
                  {lines.map((line, j) => <div key={j}><code className="break-words text-xs text-ink-muted">{line}</code></div>)}
                  {location && <div>{location}</div>}
                </div>
              </details> : <RuleText formula={v.formula} />}
            </li>;
          })}
        </ul>}
        {report.violations && report.more === 'exhausted' && <p role="status" className="text-xs text-ink-muted">No more explanations.</p>}
        {datum.diagnosticError && <p role="alert">{datum.diagnosticError}</p>}
      </section>
    );
  }
  if (!options) return null;
  return (
    <section className="overflow-auto px-5 py-4 text-sm text-ink">
      <h2 className="font-semibold">UNSAT within this scope</h2>
      {options.fixed.map((rule, i) => <p key={i}>Required outcome <RuleText formula={rule} /></p>)}
      {options.rules.length > 0 ? <>
        <details className="my-2">
          <summary className="cursor-pointer">Choose rules to keep</summary>
          {options.rules.map((rule, i) => (
            <label className="my-1 flex items-baseline gap-2" key={i}>
              <input type="checkbox" checked={keep.includes(i)}
                onChange={e => setKeep(e.target.checked ? [...keep, i] : keep.filter(k => k !== i))} />
              <RuleText formula={rule} />
              <span className="text-xs text-ink-muted">{sourceLocation(rule)}</span>
            </label>
          ))}
        </details>
        <Button size="sm" colorScheme="green" onClick={request} isDisabled={!connected || waiting}>{waiting ? 'Searching…' : 'Show near miss'}</Button>
        {datum.diagnosticError && <p role="alert">{datum.diagnosticError}</p>}
      </> : <p>No rules to drop.</p>}
      {datum.core && datum.core.length > 0 && <details className="mt-3">
        <summary>UNSAT core</summary>
        {datum.core.map((rule, i) => <div key={i}><code>{rule}</code></div>)}
      </details>}
    </section>
  );
}
