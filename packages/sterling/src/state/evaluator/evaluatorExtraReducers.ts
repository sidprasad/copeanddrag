import { EvalExpression, EvalResult } from '@/sterling-connection';
import { PayloadAction } from '@reduxjs/toolkit';
import { EvaluatorState } from './evaluator';

/**
 * Update an expression with the result of evaluating that expression.
 */
function evalReceived(
  state: EvaluatorState,
  action: PayloadAction<EvalResult>
) {
  const { id, result } = action.payload;
  state.expressionsById[id].result = result;
}

/**
 * Create an expression object and associate it with the datum.
 */
function evalRequested(
  state: EvaluatorState,
  action: PayloadAction<EvalExpression>
) {
  const { id, datumId, expression } = action.payload;
  const order = state.orderByDatumId[datumId] || [];
  state.nextExpressionId += 1;
  state.expressionsById[id] = {
    id,
    datumId,
    expression,
    result: ''
  };
  state.orderByDatumId[datumId] = [id, ...order];
}

export default {
  evalReceived,
  evalRequested
};
