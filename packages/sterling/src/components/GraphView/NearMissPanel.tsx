import { Button } from '@chakra-ui/react';
import {
  buttonClicked,
  type Datum,
  type NearMissFormula,
  type NearMissViolation
} from '@/sterling-connection';
import { useEffect, useState } from 'react';
import { activeDatumSet } from '../../state/data/dataSlice';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectIsConnected } from '../../state/selectors';
import { CounterfactualCode } from './CounterfactualCode';
import { presentViolation, sourceLocation } from './nearMissEvidence';
import './NearMissPanel.css';

function SourceRule({ formula }: { formula: NearMissFormula }) {
  const location = sourceLocation(formula);
  // The provider supplies an expanded requirement, not the original declaration.
  // Mark the predicate context as incomplete; do not imply this is its full body.
  const code = formula.predicate
    ? `pred ${formula.predicate} {\n  // …\n${formula.text
        .split('\n')
        .map((line) => `  ${line}`)
        .join('\n')}\n  // …\n}`
    : formula.text;
  return (
    <div
      className='cf-source'
      title='Only the requirement reported by Forge is shown. The predicate wrapper is schematic; ellipses mark surrounding source context that was not supplied.'
    >
      {location && (
        <div className='cf-code-caption'>
          <span title={formula.file || undefined}>{location}</span>
        </div>
      )}
      <CounterfactualCode text={code} block />
    </div>
  );
}

function RuleEvidence({
  violation,
  index
}: {
  violation: NearMissViolation;
  index: number;
}) {
  const { bindings, evaluations, caseCount } = presentViolation(violation);
  return (
    <article
      className='cf-rule'
      aria-label={`Counterfactual rule ${index + 1}`}
    >
      <SourceRule formula={violation.formula} />
      <div className='cf-evidence'>
        {bindings.length > 0 && (
          <div
            className='cf-code-caption'
            title='Forge reports this binding as evidence in the counterfactual. It maps a quantified variable from the requirement to an instance atom; it is not a source assignment or an added constraint.'
          >
            <span>Instance binding</span>
            <code>
              {bindings
                .map(({ variable, atom }) => `${variable} = ${atom}`)
                .join(', ')}
            </code>
            {caseCount > 1 && (
              <span title='Only the first reported binding is shown and highlighted.'>
                1 of {caseCount}
              </span>
            )}
          </div>
        )}
        {evaluations.map((evaluation, i) => (
          <div className='cf-evaluation' key={i}>
            <pre className='cf-code-block'>
              <span title='Expression evaluated in this instance after substitution. A Forge backtick refers to an instance atom.'>
                <CounterfactualCode text={evaluation.expression} />
              </span>
              <span className='cf-equals' title='Evaluates to'>
                {' '}
                ={' '}
              </span>
              <span title='Instance value in relational notation. Atom labels omit the Forge backtick prefix.'>
                <CounterfactualCode text={evaluation.valueText} />
              </span>
              {evaluation.omitted > 0 && (
                <span
                  title={`Showing 8 of ${evaluation.total} tuples; ${evaluation.omitted} more are omitted from the display and highlights.`}
                  aria-label={`${evaluation.omitted} more tuples`}
                >
                  {' '}
                  + …
                </span>
              )}
            </pre>
          </div>
        ))}
        {evaluations.length === 0 && (
          <p className='cf-hint'>No evaluated evidence available.</p>
        )}
      </div>
    </article>
  );
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
  const exhausted = report?.violations && report.more === 'exhausted';
  const waiting = requested && !datum.diagnosticError && !exhausted;
  const request = () => {
    const last = report?.violations ? report : undefined;
    setRequested(true);
    dispatch(
      buttonClicked({
        id: datum.id,
        onClick: 'near-miss',
        context: {
          generatorName: datum.generatorName,
          originalId: last?.originalId ?? datum.id,
          keep: last?.keep ?? keep,
          previous: last?.previous ?? []
        }
      })
    );
  };
  if (report) {
    const violations = report.violations;
    return (
      <section
        aria-label='Counterfactual explanation'
        className={`cf-panel ${violations ? 'cf-panel-witness' : ''}`}
        aria-busy={waiting}
      >
        <div className='cf-header'>
          <div className='cf-title'>
            <h2 title='The original command is UNSAT. This instance becomes possible with the displayed rules left unenforced, within the same scope and bounds.'>
              {violations
                ? 'Counterfactual'
                : 'No counterfactual with these rules kept'}
            </h2>
          </div>
          <div className='cf-actions'>
            {violations && (
              <div>
                <Button
                  size='xs'
                  variant='ghost'
                  className='cf-action'
                  isDisabled={
                    waiting || !connected || report.more !== 'available'
                  }
                  onClick={request}
                  title='Search for a different minimal set of relaxed rules, keeping the same selected rules, scope, and bounds.'
                >
                  {waiting ? 'Searching…' : 'Find another counterfactual'}
                </Button>
              </div>
            )}
            <div>
              <Button
                size='xs'
                variant='ghost'
                className='cf-action'
                onClick={() => dispatch(activeDatumSet(report.originalId))}
                title='Return to the original UNSAT result and choose which rules must hold.'
              >
                Back to rule selection
              </Button>
            </div>
          </div>
        </div>
        {violations ? (
          <>
            <p className='cf-conflict'>
              Relaxing{' '}
              {violations.length === 1
                ? 'the requirement'
                : 'these requirements'}{' '}
              below resolves the conflict within this scope.
            </p>
            <div className='cf-rules'>
              {violations.map((violation, i) => (
                <RuleEvidence key={i} violation={violation} index={i} />
              ))}
            </div>
            {report.more === 'exhausted' && (
              <p role='status' className='cf-notice'>
                No other rule sets found.
              </p>
            )}
          </>
        ) : (
          <p className='cf-intro'>
            Return to rule selection to allow more rules to change.
          </p>
        )}
        {!connected && (
          <p role='status' className='cf-notice'>
            Reconnect to Forge to search for counterfactuals.
          </p>
        )}
        {datum.diagnosticError && (
          <p role='alert' className='cf-notice'>
            {datum.diagnosticError}
          </p>
        )}
      </section>
    );
  }
  if (!options) return null;
  return (
    <section
      className='cf-panel cf-unsat'
      aria-label='UNSAT rule selection'
      aria-busy={waiting}
    >
      <h2>UNSAT within this scope</h2>

      {options.fixed.length > 0 && (
        <div className='cf-fixed'>
          <h3 className='cf-label'>Required outcome — always kept</h3>
          {options.fixed.map((rule, i) => (
            <SourceRule key={i} formula={rule} />
          ))}
        </div>
      )}
      {options.rules.length > 0 ? (
        <>
          <details className='cf-rule-selection'>
            <summary title='Checked rules must hold in every counterfactual; unchecked rules may be relaxed.'>
              Choose rules that must hold <span>({keep.length} kept)</span>
            </summary>
            {options.rules.map((rule, i) => (
              <label className='cf-keep-rule' key={i}>
                <input
                  type='checkbox'
                  checked={keep.includes(i)}
                  onChange={(e) =>
                    setKeep(
                      e.target.checked
                        ? [...keep, i]
                        : keep.filter((k) => k !== i)
                    )
                  }
                />
                <SourceRule formula={rule} />
              </label>
            ))}
          </details>
          <Button
            size='sm'
            variant='outline'
            className='cf-action'
            title='Find an instance by relaxing a minimal set of rules, within the original scope and bounds.'
            onClick={request}
            isDisabled={!connected || waiting}
          >
            {waiting ? 'Searching…' : 'Find a counterfactual'}
          </Button>
          {!connected && (
            <p role='status' className='cf-notice'>
              Reconnect to Forge to search for counterfactuals.
            </p>
          )}
          {datum.diagnosticError && (
            <p role='alert' className='cf-notice'>
              {datum.diagnosticError}
            </p>
          )}
        </>
      ) : (
        <p className='cf-intro'>
          There are no source rules available to relax for this command.
        </p>
      )}
      {datum.core && datum.core.length > 0 && (
        <details className='cf-help'>
          <summary>UNSAT core</summary>
          {datum.core.map((rule, i) => (
            <CounterfactualCode key={i} text={rule} block />
          ))}
        </details>
      )}
    </section>
  );
}
