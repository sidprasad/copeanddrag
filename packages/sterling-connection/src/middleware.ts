import { Dispatch, Middleware, MiddlewareAPI } from 'redux';
import {
  buttonClicked,
  connectSterling,
  dataRequested,
  disconnectSterling,
  evalRequested,
  metaRequested,
  sterlingConnected,
  sterlingConnectionError,
  sterlingDisconnected
} from './actions';
import { onMessage } from './receive/onMessage';
import { sendClick } from './send/sendClick';
import { sendData } from './send/sendData';
import { sendEval } from './send/sendEval';
import { sendMeta } from './send/sendMeta';

const PING_INTERVAL = 3000;
const RECONNECT_INTERVAL = 1000;

/**
 * Create a new sterling middleware function.
 */
function sterlingConnectionMiddleware<S, D extends Dispatch>(): Middleware<
  {},
  S,
  D
> {
  let ws: WebSocket | null = null;
  let reconnectIntervalId: number = 0;

  /**
   * Clears the reconnect interval, which is responsible for attempting to
   * automatically reconnect to the provider when the connection is closed.
   */
  const clearReconnectInterval = () => {
    window.clearInterval(reconnectIntervalId);
    reconnectIntervalId = 0;
  };

  /**
   * Closes the WebSocket connnection.
   */
  const disconnect = () => {
    if (ws) ws.close();
  };

  /**
   * Send a ping to the provider.
   */
  const sendPing = () => {
    if (ws) ws.send('ping');
  };

  /**
   * Establish a new connection to a Sterling provider using WebSockets. If a
   * connection exists, closes that one before opening a new one.
   *
   * @param api A Redux Middleware API.
   * @param url The URL to connect to.
   */
  const connect = (api: MiddlewareAPI<D, S>, url: string | undefined) => {
    const dispatch = api.dispatch;
    let connected = false;

    if (ws) disconnect();
    url = url || getWebSocketURLFromLocation();
    ws = new WebSocket(url);

    // a function that initializes the reconnect attempt
    const startReconnect = () => {
      clearReconnectInterval();
      reconnectIntervalId = window.setInterval(
        () => connect(api, url),
        RECONNECT_INTERVAL
      );
    };

    // respond to websocket connection events by dispatching actions
    ws.onopen = () => {
      connected = true;
      window.setTimeout(() => sendPing(), PING_INTERVAL);
      dispatch(sterlingConnected());
      clearReconnectInterval();
    };
    ws.onclose = () => {
      if (connected) {
        connected = false;
        dispatch(sterlingDisconnected());
      }
      if (ws && ws.readyState === WebSocket.CLOSED) {
        startReconnect();
      }
    };

    // respond to received messages by parsing data and dispatching actions
    ws.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data === 'pong') {
        window.setTimeout(() => sendPing(), PING_INTERVAL);
      } else {
        onMessage(event.data, api);
      }
    };
  };

  // return the middleware function
  return (api: MiddlewareAPI<D, S>) => (next: Dispatch) => (action: any) => {
    if (connectSterling.match(action)) {
      connect(api, action.payload);
    } else if (disconnectSterling.match(action)) {
      disconnect();
    } else if (buttonClicked.match(action)) {
      sendClick(ws, api, action.payload);
    } else if (dataRequested.match(action)) {
      sendData(ws, api);
    } else if (evalRequested.match(action)) {
      sendEval(ws, api, action.payload);
    } else if (metaRequested.match(action)) {
      sendMeta(ws, api);
    }
    return next(action);
  };
}

/**
 * Use the search param of the current URL to generate a WebSocket URL string.
 *
 * For example, if Sterling is loaded from http://localhost:4000?1234 then this
 * function will return a URL that can be used to establish a WebSocket
 * connection over port 1234.
 */
function getWebSocketURLFromLocation() {
  return `ws://localhost:${window.location.search.slice(1)}`;
}

export { sterlingConnectionMiddleware };
