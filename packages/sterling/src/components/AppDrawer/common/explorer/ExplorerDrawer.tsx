import { buttonClicked } from '@/sterling-connection';
import { PaneTitle } from '@/sterling-ui';
import { Box, Button, Flex, Heading, Select, Tooltip } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useSterlingSelector } from '../../../../state/hooks';
import { selectActiveDatum, selectData, selectProviderGeneratorNames, selectSelectedGenerator,  } from '../../../../state/selectors';
import { ListViewData } from './ListView/ListViewData';
import { useSterlingDispatch } from '../../../../state/hooks';
import { activeDatumSet } from 'sterling/src/state/data/dataSlice';
import { selectedGeneratorChanged } from 'sterling/src/state/ui/uiSlice';

const ExplorerDrawer = () => {
  // The datum contains its generator ID, if any
  const activeDatum = useSterlingSelector(selectActiveDatum);
  const data = useSterlingSelector(selectData);
  const generatorNames = useSterlingSelector(selectProviderGeneratorNames);
  const dispatch = useSterlingDispatch();

  // We want this to persist, even if the user tabs to another drawer and back (which may 
  // recreate the component, losing state). Thus, the state needs to live higher in the 
  // component hierarchy. Since Sterling uses Redux, we'll use Redux for this.
  // const [generator, setGenerator] = useState<string|undefined>(generatorNames ? generatorNames[0]: undefined);
  const generator = useSterlingSelector(selectSelectedGenerator);

  // There are two expected cases here:
  //   (1) We have an active datum (and thus a generator name, if the provider uses generators);
  //   (2) We have no active datum (and thus should give the user a menu of commands).
  // In the event we have neither an active datum /or/ a list of generator names, don't show the tab.

  if (!activeDatum && (!generatorNames || generatorNames.length < 1)) return null;
  
  // The generator is *new* if we have yet to fetch any instances from it. 
  const generatorIsNew = 
    !data.some(d => d.generatorName == generator)

  // When clicking a generator name, it should request an instance if we have no
  // data for that generator yet. Otherwise, it should just change the active datum. 
  const onClickRun = useCallback(
    () => {
      if(generator !== undefined && generatorIsNew) {
        console.log(`Running new generator: ${generator}`)
        dispatch(buttonClicked({id: undefined, 
                                onClick: "next", 
                                context: {generatorName: generator}}))}},
    [generator, data]
  );

  return (
    <>
      
      <Box p={1} shadow='md' borderWidth='1px'>
        <Heading fontSize='sm' align='center' fontWeight='medium'>Select an Available Command</Heading>
        <Flex>
          <Select isDisabled={!generatorNames || generatorNames.length < 1} 
                  value={generator}
                  onChange={ev => {
                    const newGenerator = ev.target.value
                    const latestForNewGenerator = data.filter(d => d.generatorName == newGenerator).reverse()[0]
                    console.log(`Selecting generator: ${newGenerator}. Latest id: ${latestForNewGenerator?.id}`); 
                    dispatch(selectedGeneratorChanged({generatorName: newGenerator}))
                    if(latestForNewGenerator) 
                      dispatch(activeDatumSet(latestForNewGenerator.id));
                    else 
                      dispatch(activeDatumSet(''))}}>
            {generatorNames?.map((name,idx) => <option key={idx}>{name}</option>)}
          </Select>
          
          <Button size='sm' 
                  margin='1'
                  onClick={onClickRun} 
                  isDisabled={!generatorNames || 
                               generatorNames.length < 1 || 
                               (generator && activeDatum?.generatorName === generator) || 
                               !generatorIsNew}>
            <Tooltip hasArrow label={'Re-run Forge to refresh this command.'} 
                     isDisabled={generatorIsNew}>Run</Tooltip>
          </Button>
        </Flex>
      </Box>

      <Box p={1} shadow='md' borderWidth='1px'>
        <Heading fontSize='xs' align='center' fontWeight='normal'>Instance History for <i>{generator}</i></Heading>
      </Box>
      
      <hr/>
      {/* Used to have: inset-0  */}
      <div aria-label='explorer pane instance selector' className='absolute flex flex-col overflow-y-auto'>
          <ListViewData data={data.filter(d => d.generatorName == generator)} active={activeDatum}/>
      </div>
    </>
  );
};

const ExplorerDrawerHeader = () => {
  return (
    <div className='flex items-center px-2 space-x-2'>
      <PaneTitle>Explorer</PaneTitle>
    </div>
  );
};

export { ExplorerDrawer, ExplorerDrawerHeader };