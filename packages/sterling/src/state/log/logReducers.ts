import { PayloadAction } from '@reduxjs/toolkit';
import { LogItemType, LogSortOrder, LogState } from './log';

/**
 * Set the log filters.
 */
function filtersChanged(state: LogState, action: PayloadAction<LogItemType[]>) {
  state.filters = action.payload;
}

/**
 * Clear the log.
 */
function logCleared(state: LogState) {
  state.items = [];
}

/**
 * Set the sort order.
 */
function sortOrderChanged(
  state: LogState,
  action: PayloadAction<LogSortOrder>
) {
  state.sort = action.payload;
}

export default {
  filtersChanged,
  logCleared,
  sortOrderChanged
};
