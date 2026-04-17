import { current, PayloadAction } from '@reduxjs/toolkit';
import { DataState } from './data';

/**
 * Set the active datum id.
 */
function activeDatumSet(state: DataState, action: PayloadAction<string>) {
  state.active = action.payload;
}

/**
 * Dump the data state to console.
 */
function dumpClicked(state: DataState) {
  console.log(current(state));
}

export default {
  activeDatumSet,
  dumpClicked
};
