import { AlloyDatum, parseAlloyXML } from '@/alloy-instance';
import { Datum } from '@/sterling-connection';
import { DatumParsed } from '../types';

export type DatumAlloy = DatumParsed<AlloyDatum>;

/**
 * Determine if a datum contains parsed data in Alloy format.
 *
 * @param datum The datum to test.
 * @return true if the parsed datum is an Alloy trace.
 */
export function isDatumAlloy(datum: DatumParsed<any>): datum is DatumAlloy {
  return datum.format === 'alloy';
}

/**
 * Generate a DatumAlloy object by parsing an Alloy XML string to produce an AlloyTrace.
 *
 * @param datum A Datum containing Alloy XML raw data.
 */
export function parseAlloyDatum(datum: Datum): DatumAlloy {
  return {
    ...datum,
    parsed: parseAlloyXML(datum.data)
  };
}
