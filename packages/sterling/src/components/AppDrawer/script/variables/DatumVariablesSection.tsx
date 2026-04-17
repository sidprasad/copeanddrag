import { DatumParsed } from '@/sterling-connection';
import { useSterlingSelector } from '../../../../state/hooks';
import { selectScriptVariables } from '../../../../state/selectors';
import { VariableRow } from './VariableRow';

interface DatumVariablesSectionProps {
  datum: DatumParsed<any>;
}

const DatumVariablesSection = (props: DatumVariablesSectionProps) => {
  const { datum } = props;
  const variables = useSterlingSelector((state) =>
    selectScriptVariables(state, datum)
  );

  return (
    <div className='flex flex-col justify-middle'>
      <div className='prose prose-md font-bold mx-2 my-2 border-b'>
        Datum Variables
      </div>
      <div className='grid grid-cols-2'>
        <div className='px-4 prose prose-sm font-semibold'>Variable</div>
        <div className='px-4 prose prose-sm font-semibold'>Type</div>
        {variables.map((variable, index) => (
          <VariableRow key={index} variable={variable} />
        ))}
      </div>
    </div>
  );
};

export { DatumVariablesSection };
