import { DataJoinParsed } from '@/sterling-connection';
import { PayloadAction } from '@reduxjs/toolkit';
import { assign, eachRight, forEach, indexOf, last, merge } from 'lodash-es';
import { DataState } from './data';

/**
 * Update stored data based on the contents of a data join.
 */
function dataReceived(state: DataState, action: PayloadAction<DataJoinParsed>) {
  const { enter, update, exit } = action.payload;

  /**
   * Add all entering data, checking that the datum id does not already exist.
   */
  if (enter) {
    eachRight(enter, (datum) => {
      const id = datum.id;
      if (!state.datumById[id]) {
        state.datumById[id] = datum;
        state.datumIds.push(id);
      }
    });
    // ** Auto-load the last datum received **
    // Note well: this logic echoes the event-handler for dataReceive in the script 
    // slice, and possibly other slices as well. If editing this, check!
    // These MUST be synched, or the wrong visualizer may load for an instance. 
    const active = last(enter);
    if (active) state.active = active.id;
  }

  /**
   * Update existing data
   */
  if (update) {
    forEach(update, (meta) => {
      const datumId = meta.id;
      if (state.datumById[datumId]) {
        merge(state.datumById[datumId], meta);
      }
    });
  }

  /**
   * Remove data
   */
  if (exit) {
    forEach(exit, (datumId) => {
      if (state.datumById[datumId]) {
        // remove from the datumById object
        delete state.datumById[datumId];

        // remove from the array of datum ids
        const index = indexOf(state.datumIds, datumId);
        if (index > -1) state.datumIds.splice(index, 1);

        // remove as active datum
        if (state.active === datumId) {
          state.active = state.datumIds.length ? state.datumIds[0] : null;
        }
      }
    });
  }
}

export default {
  dataReceived
};
