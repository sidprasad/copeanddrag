import { Dispatch, MiddlewareAPI } from 'redux';
import { sterlingError } from '../actions';
import { DataJoin } from '../payload';
import { Datum, DatumParsed } from '../types';
import { parseAlloyDatum } from './alloy';
import { parseRawDatum } from './raw';

export type DataJoinParsed = Omit<DataJoin, 'enter'> & {
  enter?: DatumParsed<any>[];
};

/**
 * Convert a DataJoin object into a ParsedDataJoin object by parsing the raw
 * data in each entering datum using the datum's specified format.
 *
 * @param join The DataJoin object to parse.
 * @param api A Redux MiddlwareAPI.
 */
export function parseJoin<D extends Dispatch, S>(
  join: DataJoin,
  api: MiddlewareAPI<D, S>
): DataJoinParsed {
  const { enter, update, exit } = join;
  const supported = validateFormats(enter, api);
  return {
    enter: supported.map((datum) => {
      switch (datum.format) {
        case 'alloy':
          return parseAlloyDatum(datum);
        case 'raw':
          return parseRawDatum(datum);
        default:
          throw new Error('Unsupported format fell through unexpectedly.');
      }
    }),
    update,
    exit
  };
}

/**
 * Validate an array of Datum objects by checking that their formats are supported, and
 * return a list of Datum objects with supported formats. An error message will be
 * dispatched for every unsupported datum.
 *
 * @param data An array of Datum objects.
 * @param api A Redux MiddlewareAPI.
 * @return A filtered array of Datum objects, containing only those with supported formats. An empty array if the *data* parameter is undefined.
 */
function validateFormats<D extends Dispatch, S>(
  data: Datum[] | undefined,
  api: MiddlewareAPI<D, S>
): Datum[] {
  const supported: Datum[] = [];
  if (data)
    data.forEach((datum) => {
      if (formatIsSupported(datum)) {
        datum.id = `${datum.id}`;
        supported.push(datum);
      } else {
        api.dispatch(
          sterlingError(
            `Unsupported data format in datum ${datum.id}: ${datum.format}`
          )
        );
      }
    });
  return supported;
}

/**
 * Determine if a Datum object's format is supported.
 *
 * @param datum The Datum object to test.
 * @return true if the Datum's format is supported, false otherwise.
 */
function formatIsSupported(datum: Datum): boolean {
  const format = datum.format;
  return format === 'alloy' || format === 'raw';
}
