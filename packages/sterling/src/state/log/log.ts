export type LogMessage = {
  type: 'message';
  text: string;
  time: string;
};

export type LogWarning = {
  type: 'warning';
  text: string;
  time: string;
};

export type LogError = {
  type: 'error';
  text: string;
  time: string;
};

export type LogItem = LogMessage | LogWarning | LogError;
export type LogItemType = LogItem['type'];
export type LogSortOrder = 'ascending' | 'descending';

export interface LogState {
  // a list of all log items
  items: LogItem[];
  // a list of item types to display
  filters: LogItemType[];
  // the order in which to display the items (based on their timestamp)
  sort: LogSortOrder;
}

/**
 * Create a new log state.
 */
export const newLogState = (): LogState => {
  return {
    items: [],
    filters: ['message', 'warning', 'error'],
    sort: 'ascending'
  };
};

/**
 * Create a new log message.
 *
 * @param text The message text.
 */
export function newMessage(text: string): LogMessage {
  return {
    type: 'message',
    time: new Date().toJSON(),
    text
  };
}

/**
 * Create a new log warning.
 *
 * @param text The warning text.
 */
export function newWarning(text: string): LogWarning {
  return {
    type: 'warning',
    time: new Date().toJSON(),
    text
  };
}

/**
 * Create a new log error.
 *
 * @param text The error text.
 */
export function newError(text: string): LogError {
  return {
    type: 'error',
    time: new Date().toJSON(),
    text
  };
}
