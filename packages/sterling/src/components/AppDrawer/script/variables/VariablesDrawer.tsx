import { DatumParsed } from '@/sterling-connection';
import { PaneTitle } from '@/sterling-ui';
import { DatumVariablesSection } from './DatumVariablesSection';
import { StageVariablesSection } from './StageVariablesSection';

interface VariablesDrawerProps {
  datum: DatumParsed<any>;
}

const VariablesDrawer = (props: VariablesDrawerProps) => {
  const { datum } = props;

  return (
    <div className='absolute inset-0 flex flex-col overflow-y-auto'>
      <StageVariablesSection />
      <DatumVariablesSection datum={datum} />
    </div>
  );
};

const VariablesDrawerHeader = () => {
  return (
    <div className='w-full flex items-center px-2 space-x-2'>
      <PaneTitle>Variables</PaneTitle>
    </div>
  );
};

export { VariablesDrawer, VariablesDrawerHeader };
