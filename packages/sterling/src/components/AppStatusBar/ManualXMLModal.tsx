import { Button, FormControl, FormLabel, Modal, ModalBody, ModalCloseButton, 
         ModalContent, ModalFooter, ModalHeader, ModalOverlay, Textarea, 
         useToast, Input, Divider, Center, Spacer } from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { dataReceived } from 'sterling-connection/src/actions';
import { parseAlloyDatum } from 'sterling-connection/src/parse/alloy';
import store from 'sterling/src/state/store';

interface ManualXMLModelProps {
    isOpen: boolean,
    onClose: () => void
}

export const TEXT_manual_entry_modal_add_button = 'Add Datum'
export const TEXT_manual_entry_modal_textarea_label = 'XML datum string to add'

const placeholderXML = `
<instance bitwidth= "4" maxseq= "-1" command= "example-run" filename= "no-filename.als" version= "1.5.0">
<sig label= "seq/Int" ID= "0" parentID= "1" builtin= "yes"> </sig>
<sig label= "Int" ID= "1" parentID= "2" builtin= "yes"> </sig>
<sig label= "univ" ID= "2" builtin= "yes"> </sig>

</instance>
`

/**
 * A modal dialogue box that, when its button is clicked, will parse
 * the input as XML, interpret it as an Alloy instance, and add it
 * to the current datum list.
 */
export function ManualXMLModal({isOpen, onClose}: ManualXMLModelProps) {  
  /** Reference for the paste-in-XML text area */
  const initialRef = useRef<HTMLTextAreaElement | null>(null)
  /** Controlled value in the paste-in-XML text area */
  let [xmlValue, setXMLValue] = useState('')

  const toast = useToast()

  /** Reference for the load-from-file hidden input */
  const inputFileRef = useRef<HTMLInputElement | null>(null);
 
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent maxW="70rem" >

          <ModalHeader><Center>Input Alloy-style XML datum (paste directly or load from file)</Center></ModalHeader>
          <ModalCloseButton />

          <ModalBody pb={6}>
            <Button onClick={() => inputFileRef.current?.click()}>
              Click to add XML from file
            </Button> ...or simply paste in an XML datum below. Then click the "Add Datum" button.
            <Spacer h='1rem' />
            <Divider orientation='horizontal' mx={5} />
            <Spacer h='1rem' />
            <FormControl>
              <FormLabel>{TEXT_manual_entry_modal_textarea_label}</FormLabel>
              <Textarea minH="20rem" ref={initialRef} placeholder={placeholderXML} 
              value={xmlValue}
              onChange={e => setXMLValue(e.target.value)}
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button onClick={() => {
              const dataEntered: string | undefined = initialRef.current?.value
              if(dataEntered === undefined) {onClose(); return}
              
              // New ID should default to the next highest positive integer ID used
              //   (IDs that are non-numeric will be ignored for this purpose)
              const currentIDs: string[] = store.getState().data.datumIds
              console.log(currentIDs)
              const nextIDInt: number = currentIDs.reduce( 
                (prev: number, curr: string) => {
                    return !isNaN(parseInt(curr)) 
                      ? (Math.max(prev, parseInt(curr) + 1))
                      : prev
                }, 
                0)
              //console.log(nextIDInt)
              
              try {
                store.dispatch(dataReceived(
                  {enter: 
                    [parseAlloyDatum({
                      id: nextIDInt.toString(), 
                      format: "alloy", 
                      data: dataEntered,
                      buttons: [],
                      evaluator: false})], 
                   update: [], 
                   exit: []}))
                } catch(e) {
                    // error parsing Alloy XML
                    toast({
                        variant: 'top-accent',
                        position: 'bottom-right',
                        title: e instanceof Error ? e.name : 'Error adding instance',
                        description: e instanceof Error ? e.message : 'No further information is available.',
                        status: 'error',
                        duration: 10000,
                        isClosable: true
                      })
                }

                // Finally, close the modal dialog
                onClose()
            }}
            >{TEXT_manual_entry_modal_add_button}</Button>

            {/* Hidden input for file upload */}
            <Input type='file' 
                   ref={inputFileRef} 
                   style={{display: 'none'}}
                   onChange={e => {
                      const reader = new FileReader()
                      reader.onload = async (e) => { 
                        if(e.target?.result)
                          if(e.target.result instanceof ArrayBuffer) {
                            setXMLValue(e.target.result.toString())
                          } else {
                            setXMLValue(e.target.result)
                          }
                      }
                      if(e.target?.files && e.target.files.length > 0)
                        reader.readAsText(e.target.files[0])
                   }}
                   />
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
