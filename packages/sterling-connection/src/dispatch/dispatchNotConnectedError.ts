import { Dispatch, MiddlewareAPI } from 'redux';
import { sterlingError } from '../actions';

export function dispatchNotConnectedError<D extends Dispatch, S>(
  api: MiddlewareAPI<D, S>
) {
  api.dispatch(sterlingError('Not connected to a provider.'));
}
