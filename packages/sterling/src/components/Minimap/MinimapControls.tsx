import { ButtonGroup, Center, IconButton } from '@chakra-ui/react';
import {
  BiArrowToLeft,
  BiArrowToRight,
  BiLeftArrowAlt,
  BiRightArrowAlt,
  BiChevronDown,
  BiChevronUp,
  BiUndo
} from 'react-icons/bi';
import { MinimapProps } from './Minimap';

const MinimapControls = (props: MinimapProps) => {
  const {
    collapsed,
    current,
    length,
    onChange,
    label,
    loopBack,
    onToggleCollapse
  } = props;
  return (
    <div className='flex'>
      <ButtonGroup width='full' isAttached size='sm'>
        <IconButton
          aria-label='First State'
          icon={<BiArrowToLeft />}
          borderRadius={0}
          disabled={current === 0}
          onClick={() => onChange(0)}
        />
        <IconButton
          aria-label='Previous State'
          borderRadius={0}
          icon={<BiLeftArrowAlt />}
          disabled={current === 0}
          onClick={() => onChange(current - 1)}
        />
        <Center width='full' px={2} fontSize='xs' bg='gray.100'>
          {label(current)}
        </Center>
        {loopBack !== undefined && current === length - 1 ? (
          <IconButton
            aria-label='Loop Back'
            borderRadius={0}
            icon={<BiUndo />}
            onClick={() => onChange(loopBack)}
          />
        ) : (
          <IconButton
            aria-label='First State'
            borderRadius={0}
            icon={<BiRightArrowAlt />}
            disabled={current === length - 1}
            onClick={() => onChange(current + 1)}
          />
        )}
        <IconButton
          aria-label='Previous State'
          icon={<BiArrowToRight />}
          disabled={current === length - 1}
          onClick={() => onChange(length - 1)}
        />
        <IconButton
          aria-label='Toggle Minimap'
          size='sm'
          borderRadius={0}
          borderLeftWidth={1}
          borderLeftColor='gray.300'
          icon={collapsed ? <BiChevronDown /> : <BiChevronUp />}
          onClick={() => onToggleCollapse()}
        />
      </ButtonGroup>
    </div>
  );
};

export { MinimapControls };
