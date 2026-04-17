import { DatumParsed } from '@/sterling-connection';

export interface DataState {
  // the id of the active datum
  active: string | null;
  // data stored by datum id
  datumById: Record<string, DatumParsed<any>>;
  // an ordered array of datum ids
  datumIds: string[];
}

/**
 * Create an empty data state.
 */
export const newDataState = (): DataState => {
  return {
    active: null,
    datumById: {},
    datumIds: []
  };
};
