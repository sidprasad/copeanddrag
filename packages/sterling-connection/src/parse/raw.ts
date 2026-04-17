import { Datum, DatumParsed } from '@/sterling-connection';

export type DatumRaw = DatumParsed<string>;

export function isDatumRaw(datum: DatumParsed<any>): datum is DatumRaw {
  return datum.format === 'raw';
}

export function parseRawDatum(datum: Datum): DatumRaw {
  return {
    ...datum,
    parsed: datum.data
  };
}
