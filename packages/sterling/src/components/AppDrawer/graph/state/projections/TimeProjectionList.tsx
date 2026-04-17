import { DatumParsed } from '@/sterling-connection';
import { useSterlingSelector } from '../../../../../state/hooks';
import {
  selectProjectableTypes,
  selectProjections,
  selectRelations
} from '../../../../../state/selectors';
import { TimeProjectionListItem } from './TimeProjectionListItem';

const TimeProjectionList = ({ datum }: { datum: DatumParsed<any> }) => {
  // Get Record<string, string[]> mapping type names to atom names
  const projectable = useSterlingSelector((state) =>
    selectProjectableTypes(state, datum)
  );

  // Get the existing projections and extract the time ones
  const projections = useSterlingSelector((state) =>
    selectProjections(state, datum)
  );
  const time = projections.filter((proj) => proj.time === true);

  // Get the names of all relations that could be used to define an ordering
  const relations = useSterlingSelector((state) =>
    selectRelations(state, datum)
  );

  // Render nothing if there are no time projections
  if (time.length === 0) return null;

  return (
    <div className='p-2 grid grid-cols-[minmax(min-content,max-content)_minmax(max-content,auto)_minmax(min-content,max-content)] gap-y-2'>
      {time.map((projection) => {
        const type = projection.type;
        const atoms = projectable[type];
        return (
          <TimeProjectionListItem
            key={type}
            datum={datum}
            projection={projection}
            atoms={atoms}
            relations={relations}
          />
        );
      })}
    </div>
  );
};

export { TimeProjectionList };
