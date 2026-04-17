import { Dispatch, MiddlewareAPI } from 'redux';
import { dispatchNotConnectedError } from '../dispatch/dispatchNotConnectedError';
import { newSendEvalMsg } from '../message';
import { EvalExpression } from '../payload';
import { sendMessage } from './sendMessage';

export function sendEval<D extends Dispatch, S>(
  ws: WebSocket | null,
  api: MiddlewareAPI<D, S>,
  payload: EvalExpression
) {
  if (!ws) return dispatchNotConnectedError(api);
  sendMessage(ws, newSendEvalMsg(1, payload));
}
