import { Button, Input, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectSynthesisExamples,
  selectSynthesisInstances,
  selectSynthesisStep,
  selectSynthesisNumInstances,
  selectActiveDatum,
  selectSynthesisCurrentDataInstance
} from '../../../../state/selectors';
import { commitDraftSelection } from '../../../../state/synthesis/synthesisSlice';
import { buttonClicked } from '@/sterling-connection';

/**
 * Example collection step - user enters atom IDs in text input
 * Atoms are highlighted in the graph as they type
 */
export const SynthesisExampleStep = () => {
  const dispatch = useSterlingDispatch();
  const currentStep = useSterlingSelector(selectSynthesisStep);
  const examples = useSterlingSelector(selectSynthesisExamples);
  const instances = useSterlingSelector(selectSynthesisInstances);
  const numInstances = useSterlingSelector(selectSynthesisNumInstances);
  const datum = useSterlingSelector(selectActiveDatum);
  const currentDataInstance = useSterlingSelector(selectSynthesisCurrentDataInstance);
  const [inputText, setInputText] = useState<string>('');
  const [selectedAtomIds, setSelectedAtomIds] = useState<string[]>([]);

  const instanceIndex = currentStep - 1;
  const instance = instances[instanceIndex];
  const currentExample = examples.find((ex) => ex.instanceIndex === instanceIndex);

  // Initialize from existing example if present, otherwise clear
  useEffect(() => {
    if (currentExample) {
      setSelectedAtomIds(currentExample.selectedAtomIds);
      setInputText(currentExample.selectedAtomIds.join(', '));
    } else {
      setSelectedAtomIds([]);
      setInputText('');
      // Clear any existing highlights
      const graphEl = document.querySelector('webcola-cnd-graph');
      if (graphEl && (graphEl as any).clearNodeHighlights) {
        (graphEl as any).clearNodeHighlights();
      }
    }
  }, [instanceIndex, currentExample]);

  // Parse input text
  useEffect(() => {
    const parsed = inputText
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);
    setSelectedAtomIds(parsed);
  }, [inputText]);
  
  // Highlight nodes when input loses focus
  const handleBlur = () => {
    const graphEl = document.querySelector('webcola-cnd-graph');
    if (!graphEl) {
      console.warn('[SynthesisExample] Graph element not found');
      return;
    }
    
    // Clear previous highlights
    if ((graphEl as any).clearNodeHighlights) {
      (graphEl as any).clearNodeHighlights();
    }
    
    // Highlight the selected nodes
    if (selectedAtomIds.length > 0 && (graphEl as any).highlightNodes) {
      const success = (graphEl as any).highlightNodes(selectedAtomIds);
      console.log('[SynthesisExample] Highlighted nodes:', selectedAtomIds, 'success:', success);
    }
  };

  // Early return after all hooks
  if (!instance) {
    return (
      <div className="p-8 text-center">
        <Text color="gray.500">Loading instance...</Text>
      </div>
    );
  }

  const handleNext = () => {
    // Ensure we have the current data instance
    if (!currentDataInstance) {
      console.error('[SynthesisExample] No data instance available');
      return;
    }
    
    console.log('[SynthesisExample] Committing selection:', { instanceIndex, atomIds: selectedAtomIds });
    
    // Commit draft to examples with data instance AND atom IDs
    dispatch(commitDraftSelection({ 
      instanceIndex, 
      dataInstance: currentDataInstance,
      atomIds: selectedAtomIds 
    }));
    
    // Request next instance from Forge if not the last one
    if (currentStep < numInstances && datum?.generatorName) {
      console.log('[SynthesisExample] Requesting next instance from Forge');
      dispatch(buttonClicked({
        id: undefined,
        onClick: "next",
        context: { generatorName: datum.generatorName }
      }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border-b border-blue-200">
        <Text fontSize="sm" fontWeight="semibold" mb={1} color="blue.900">
          Instance {instanceIndex + 1} of {numInstances}
        </Text>
        <Text fontSize="xs" color="blue.700">
          Enter atom IDs (comma-separated) that should match your selector.
          Atoms will be highlighted in the graph in real-time.
        </Text>
      </div>

      {/* Text input for atom IDs */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Atom IDs (comma-separated)
          </label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={handleBlur}
            size="lg"
            fontFamily="monospace"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Next button */}
      <div className="p-4 border-t bg-gray-50">
        <Button
          w="full"
          colorScheme="blue"
          size="lg"
          onClick={handleNext}
          isDisabled={selectedAtomIds.length === 0}
        >
          {currentStep < numInstances ? (
            <>Next Instance →</>
          ) : (
            <>Synthesize Selector</>
          )}
        </Button>
      </div>
    </div>
  );
};