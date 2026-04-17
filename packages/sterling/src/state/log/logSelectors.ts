import { LogItem, LogState } from './log';

/**
 * Select all log items.
 */
function selectLogItems(state: LogState): LogItem[] {
  return state.items;
}

export default {
  selectLogItems
};
