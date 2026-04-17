import { Click, DataJoinParsed, ProviderMeta } from '@/sterling-connection';
import { PayloadAction } from '@reduxjs/toolkit';
import { LogState, newError, newMessage } from './log';

/**
 * Add a datum selection to the log.
 */
function activeDatumSet(state: LogState, action: PayloadAction<string>) {
  state.items.push(newMessage(`Datum selected - Datum ID: ${action.payload}`));
}

/**
 * Add a button click to the log.
 */
function buttonClicked(state: LogState, action: PayloadAction<Click>) {
  const { id, onClick } = action.payload;
  state.items.push(
    newMessage(`Click button - Datum ID: ${id} - Button: ${onClick}`)
  );
}

/**
 * Add a data join to the log.
 */
function dataReceived(state: LogState, action: PayloadAction<DataJoinParsed>) {
  const { enter, update, exit } = action.payload;
  const en = enter?.length || 0;
  const up = update?.length || 0;
  const ex = exit?.length || 0;
  state.items.push(
    newMessage(`Receive data: ${en} enter, ${up} update, ${ex} exit.`)
  );
}

/**
 * Add a request for data to the log.
 */
function dataRequested(state: LogState) {
  state.items.push(newMessage('Request data.'));
}

/**
 * Add provider metadata to the log.
 */
function metaReceived(state: LogState, action: PayloadAction<ProviderMeta>) {
  const { name } = action.payload;
  state.items.push(newMessage(`Receive metadata from ${name}.`));
}

/**
 * Add a successful connection to a provider to the log.
 */
function sterlingConnected(state: LogState) {
  state.items.push(newMessage('Connection established.'));
}

/**
 * Add a connection error to the log.
 */
function sterlingConnectionError(
  state: LogState,
  action: PayloadAction<string>
) {
  state.items.push(newError(action.payload));
}

/**
 * Add a disconnection from a provider to the log.
 * @param state
 */
function sterlingDisconnected(state: LogState) {
  state.items.push(newMessage('Connection lost.'));
}

/**
 * Add an error to the log.
 */
function sterlingError(state: LogState, action: PayloadAction<string>) {
  state.items.push(newError(action.payload));
}

export default {
  activeDatumSet,
  buttonClicked,
  dataReceived,
  dataRequested,
  metaReceived,
  sterlingConnected,
  sterlingConnectionError,
  sterlingDisconnected,
  sterlingError
};
