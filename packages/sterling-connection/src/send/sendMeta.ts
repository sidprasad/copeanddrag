import { Dispatch, MiddlewareAPI } from 'redux';
import { dispatchNotConnectedError } from '../dispatch/dispatchNotConnectedError';
import { newSendMetaMsg } from '../message';
import { sendMessage } from './sendMessage';

export function sendMeta<D extends Dispatch, S>(
  ws: WebSocket | null,
  api: MiddlewareAPI
) {
  if (!ws) return dispatchNotConnectedError(api);
  sendMessage(ws, newSendMetaMsg(1));
}
