import { Button, ButtonGroup, Tooltip } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { ScriptStageType } from '../../state/script/script';
import { scriptStageSet } from '../../state/script/scriptSlice';
import { selectScriptStage } from '../../state/selectors';

interface ScriptViewHeaderButtonsProps {
  onExecute: () => void;
}

const ScriptViewHeaderButtons = (props: ScriptViewHeaderButtonsProps) => {
  const { onExecute } = props;

  const stage = useSterlingSelector(selectScriptStage);
  const dispatch = useSterlingDispatch();

  const onStageSet = useCallback((type: ScriptStageType) => {
    dispatch(scriptStageSet(type));
  }, []);

  return (
    <div className='flex'>
      <Tooltip hasArrow label=''>
        <Button colorScheme='blue' size='xs' onClick={onExecute}>
          Run
        </Button>
      </Tooltip>
      <ButtonGroup className='pl-2' isAttached colorScheme='blue' size='xs'>
        <Button isActive={stage === 'div'} onClick={() => onStageSet('div')}>
          {'<div>'}
        </Button>
        <Button
          isActive={stage === 'canvas'}
          onClick={() => onStageSet('canvas')}
        >
          {'<canvas>'}
        </Button>
        <Button isActive={stage === 'svg'} onClick={() => onStageSet('svg')}>
          {'<svg>'}
        </Button>
      </ButtonGroup>
    </div>
  );
};

export { ScriptViewHeaderButtons };
