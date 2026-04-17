import { DatumParsed } from '@/sterling-connection';
import { useSterlingSelector } from '../../../../../state/hooks';
import { selectDatumIsTrace } from '../../../../../state/selectors';
import { AddTimeProjectionButton } from './AddTimeProjectionButton';
import { TimeProjectionList } from './TimeProjectionList';

const TimeProjectionSection = ({ datum }: { datum: DatumParsed<any> }) => {
  // We only want to show this section if the datum is NOT a trace
  const isTrace = useSterlingSelector((state) =>
    selectDatumIsTrace(state, datum)
  );

  if (isTrace) return null;

  return (
    <div className='flex flex-col justify-middle'>
      <TimeProjectionList datum={datum} />
      <AddTimeProjectionButton datum={datum} />
    </div>
  );
};

export { TimeProjectionSection };
