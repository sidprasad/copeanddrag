import { DatumParsed } from '@/sterling-connection';
import { EvaluatorState, Expression } from './evaluator';

/**
 * Select the ordered array of expression associated with a datum.
 */
function selectDatumExpressions(
  state: EvaluatorState,
  datum: DatumParsed<any>
): Expression[] {
  const order = state.orderByDatumId[datum.id] || [];
  return order.map((expressionId) => state.expressionsById[expressionId]);
}

/**
 * Select the next expression id.
 */
function selectNextExpressionId(state: EvaluatorState): number {
  return state.nextExpressionId;
}

export default {
  selectDatumExpressions,
  selectNextExpressionId
};
