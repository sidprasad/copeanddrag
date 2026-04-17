import { DatumParsed } from '@/sterling-connection';
import { useSterlingSelector } from '../../../../../state/hooks';
import { selectDatumIsTrace } from '../../../../../state/selectors';
import { TimePicker } from './TimePicker';

const TimeSection = ({ datum }: { datum: DatumParsed<any> }) => {
  // We only want to show this section if the datum IS a trace
  const isTrace = useSterlingSelector((state) =>
    selectDatumIsTrace(state, datum)
  );

  if (!isTrace) return null;

  return (
    <div className='flex flex-col justify-middle'>
      <TimePicker datum={datum} />
    </div>
  );
};

export { TimeSection };
