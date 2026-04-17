import {
  dataReceived,
  evalReceived,
  metaReceived
} from '@/sterling-connection';
import { Dispatch, MiddlewareAPI } from 'redux';
import { isRecvDataMsg, isRecvEvalMsg, isRecvMetaMsg, Msg } from '../message';
import { parseJoin } from '../parse/parse';

/**
 * Parse a message from the data provider and dispatch actions to the store.
 *
 * @param message The message.
 * @param api The DispatchAPI provided to the middleware.
 */
export function onMessage<D extends Dispatch, S>(
  message: string,
  api: MiddlewareAPI<D, S>
) {
  const msg = parseMessage(message);
  if (isRecvDataMsg(msg)) {
    api.dispatch(dataReceived(parseJoin(msg.payload, api)));
  } else if (isRecvEvalMsg(msg)) {
    api.dispatch(evalReceived(msg.payload));
  } else if (isRecvMetaMsg(msg)) {
    // Both the provider slice and UI slice have this action:
    api.dispatch(metaReceived(msg.payload));
  }
}

/**
 * Convert a string to a Msg object.
 *
 * @param message The message to convert.
 */
function parseMessage(message: string): Msg {
  return JSON.parse(message);
}
