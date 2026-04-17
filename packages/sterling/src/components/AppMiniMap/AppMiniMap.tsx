import { MiniMap } from '@/sterling-ui';
import { Box } from '@chakra-ui/react';

const AppMiniMap = () => {
  return (
    <Box
      position='absolute'
      top='12px'
      left='50%'
      transform='translate(-50%)'
      width='350px'
      height='50px'
      backgroundColor='white'
      shadow='base'
      borderRadius='base'
      border='1px'
      borderColor='gray.400'
      bg='white'
    >
      <MiniMap
        numStates={5}
        loopBack={3}
        selectedIndices={[0]}
        onSelectedIndicesDidChange={() => {}}
      />
    </Box>
  );
};

export { AppMiniMap };
