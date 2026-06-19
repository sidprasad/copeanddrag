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
 * Heuristic test for whether a payload is an Alloy-format XML document: a single
 * `<alloy>` root (optionally preceded by an XML declaration), which may wrap one
 * `<instance>` per time step with a `loop` attribute encoding a trace lasso.
 *
 * Used to recognize Alloy XML that arrives under the generic 'raw' format so it
 * can be parsed as a trace rather than kept as an opaque string.
 */
export function isAlloyXML(data: string): boolean {
  return /^\s*(?:<\?xml[^>]*\?>\s*)?<alloy[\s>]/.test(data);
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
