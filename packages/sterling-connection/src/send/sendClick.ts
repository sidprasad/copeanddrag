import { Dispatch, MiddlewareAPI } from 'redux';
import { dispatchNotConnectedError } from '../dispatch/dispatchNotConnectedError';
import { newSendClickMsg } from '../message';
import { Click } from '../payload';
import { sendMessage } from './sendMessage';

export function sendClick<D extends Dispatch, S>(
  ws: WebSocket | null,
  api: MiddlewareAPI<D, S>,
  payload: Click
) {
  if (!ws) return dispatchNotConnectedError(api);
  sendMessage(ws, newSendClickMsg(1, payload));
}
