import { Dispatch, MiddlewareAPI } from 'redux';
import { dispatchNotConnectedError } from '../dispatch/dispatchNotConnectedError';
import { newSendDataMsg } from '../message';
import { sendMessage } from './sendMessage';

export function sendData<D extends Dispatch, S>(
  ws: WebSocket | null,
  api: MiddlewareAPI<D, S>
) {
  if (!ws) return dispatchNotConnectedError(api);
  sendMessage(ws, newSendDataMsg(1));
}
