import {
  dataRequested,
  metaRequested,
  sterlingConnected
} from '@/sterling-connection';
import { Dispatch, Middleware, MiddlewareAPI } from 'redux';

function sterlingMiddleware<S, D extends Dispatch>(): Middleware<{}, S, D> {
  return (api: MiddlewareAPI<D, S>) => (next: Dispatch) => (action: any) => {
    if (sterlingConnected.match(action)) {
      next(action);

      api.dispatch(metaRequested());
      // This data request may respond with an instance datum. If it doesn't,
      // that means the provider uses generator names to index multiple instance 
      // streams, in which case Sterling should query one by name using "click".
      api.dispatch(dataRequested());
    } else {
      return next(action);
    }
  };
}

export { sterlingMiddleware };
