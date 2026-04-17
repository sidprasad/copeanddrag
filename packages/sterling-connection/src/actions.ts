import { createAction } from '@reduxjs/toolkit';
import { DataJoinParsed } from './parse/parse';
import { Click, EvalExpression, EvalResult, ProviderMeta } from './payload';

// actions to be dispatched by the store
const buttonClicked = createAction<Click>('sterling/buttonClicked');
const dataRequested = createAction('sterling/dataRequested');
const evalRequested = createAction<EvalExpression>('sterling/evalRequested');
const metaRequested = createAction('sterling/metaRequested');

// actions dispatched by the middleware
const dataReceived = createAction<DataJoinParsed>('sterling/dataReceived');
const evalReceived = createAction<EvalResult>('sterling/evalReceived');
const metaReceived = createAction<ProviderMeta>('sterling/metaReceived');

// connection actions (to be dispatched by the store)
const connectSterling = createAction<string | undefined>('sterling/connect');
const disconnectSterling = createAction('sterling/disconnect');

// connection actions (dispatched by the middleware)
const sterlingConnected = createAction('sterling/connected');
const sterlingConnectionError = createAction<string>(
  'sterling/connectionError'
);
const sterlingDisconnected = createAction('sterling/disconnected');
const sterlingError = createAction<string>('sterling/error');

export {
  buttonClicked,
  dataRequested,
  evalRequested,
  metaRequested,
  dataReceived,
  evalReceived,
  metaReceived,
  connectSterling,
  disconnectSterling,
  sterlingConnected,
  sterlingConnectionError,
  sterlingDisconnected,
  sterlingError
};
