import { Modal, ModalBody, ModalCloseButton, 
         ModalContent, ModalFooter, ModalHeader, ModalOverlay, Center, 
         Box,
         Divider} from '@chakra-ui/react';
import { useSterlingSelector } from 'sterling/src/state/hooks';
import { selectMainView } from 'sterling/src/state/selectors';

interface HelpProps {
  isOpen: boolean,
  onClose: () => void
}
        
export const TEXT_close_help_modal = "Close"

/**
 * A modal dialogue box that shows some simple help information on
 * interacting with Spytial Sterling in various visualizers.
 */
export function HelpModal({isOpen, onClose}: HelpProps) {  
  const mainView = useSterlingSelector(selectMainView);
 
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent maxW="70rem" >
          <ModalHeader><Center>Using Spytial Sterling</Center></ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Box as="ul" listStyleType="circle">
                <li>Use the <strong>evaluator</strong> tab to query the value of expressions and constraints.</li>
                <li>The <strong>explorer</strong> tab lets you pick a run to visualize. Click on any prior instance to reload it in the visualizer.</li>
            </Box>
            <Divider orientation="horizontal" colorScheme="blackAlpha" />
            {mainView === 'ScriptView' && <ScriptViewHelp/>}
            {mainView === 'GraphView' && <GraphViewHelp/>}
            {mainView === 'TableView' && <TableViewHelp/>}
          </ModalBody>

        </ModalContent>
      </Modal>
    </>
  )
}

function GraphViewHelp() {
    return (
      <>
      <Center><strong>Graph View</strong></Center>
      <Box as="ul" listStyleType="circle">
        <li><strong>Zoom</strong> with the mouse wheel or with <em>two fingers</em> on the trackpad.</li>
        <li>The <strong>time</strong> tab will let you adjust the layout according to time index, if 
          that is appropriate for your model. In a Temporal model, you'll see a minimap and have the option 
          to move back and forth in time. In a model that isn't explicitly temporal, you can still declare 
          a sig as the time index and use it to navigate.</li>
        <li>The <strong>layout</strong> tab opens the Spytial interface, which gives more control over your instance diagram.</li>
      </Box></>)
}
function ScriptViewHelp() {
    return (
    <>
      <Center><strong>Script View</strong></Center>
      <Box as="ul" listStyleType="circle">
      </Box></>)
}
function TableViewHelp() {
    return (
    <>
        <Center><strong>Table View</strong></Center>
        <Box as="ul" listStyleType="circle">
        </Box></>)    
}
