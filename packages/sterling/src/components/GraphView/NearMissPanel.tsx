import { Button } from '@chakra-ui/react';
import { buttonClicked, type Datum } from '@/sterling-connection';
import { useEffect, useState } from 'react';
import { activeDatumSet } from '../../state/data/dataSlice';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectIsConnected } from '../../state/selectors';

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
        <div className="flex items-center justify-between gap-3">
          <strong>{report.violations ? 'Near miss · original command is UNSAT' : 'No near miss to display'}</strong>
          <div className="flex items-center gap-2">
            {report.violations && report.more === 'available' && (
              <Button size="xs" isDisabled={waiting || !connected} onClick={request}>
                {waiting ? 'Searching…' : 'Another explanation'}
              </Button>
            )}
            <Button size="xs" onClick={() => dispatch(activeDatumSet(report.originalId))}>Back to UNSAT</Button>
          </div>
        </div>
        {report.violations ? <>
          <p>Every other rule holds. Restoring any one of the rules below makes the command UNSAT again.</p>
          <ul className="list-disc pl-5">
            {report.violations.map((v, i) => <li key={i}>
              <code>{v.rule}</code>
              {v.details.map((line, j) => <div key={j}>{line}</div>)}
            </li>)}
          </ul>
          {report.more === 'exhausted' && <p role="status">No other minimal explanation exists with these rules pinned.</p>}
        </> : <p role="status">{report.message}</p>}
        {datum.diagnosticError && <p role="alert">{datum.diagnosticError}</p>}
      </section>
    );
  }
  if (!options) return null;
  return (
    <section className="overflow-auto px-5 py-4 text-sm text-ink">
      <h2 className="font-semibold">UNSAT within this scope</h2>
      {options.fixed.map((rule, i) => <p key={i}>Required outcome: <code>{rule}</code></p>)}
      {options.rules.length > 0 ? <>
        <details className="my-2">
          <summary className="cursor-pointer">Choose rules to keep</summary>
          {options.rules.map((rule, i) => (
            <label className="my-1 flex items-baseline gap-2" key={i}>
              <input type="checkbox" checked={keep.includes(i)}
                onChange={e => setKeep(e.target.checked ? [...keep, i] : keep.filter(k => k !== i))} />
              <code>{rule}</code>
            </label>
          ))}
        </details>
        <Button size="sm" colorScheme="green" onClick={request} isDisabled={!connected || waiting}>Show near miss</Button>
        {datum.diagnosticError && <p role="alert">{datum.diagnosticError}</p>}
        {waiting && connected && <span className="ml-3" role="status">Finding a witness…</span>}
      </> : <p>The requested outcome is fixed and this command has no assumptions to relax.</p>}
      {datum.core && datum.core.length > 0 && <details className="mt-3">
        <summary>UNSAT core</summary>
        {datum.core.map((rule, i) => <div key={i}><code>{rule}</code></div>)}
      </details>}
    </section>
  );
}
