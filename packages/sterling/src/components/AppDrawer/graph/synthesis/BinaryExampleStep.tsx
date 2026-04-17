import { Badge, Button, Input, Text, VStack, HStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { MdArrowForward, MdClose } from 'react-icons/md';
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
 * Binary example collection - user enters pairs in text input
 * Pairs are highlighted in the graph as they type
 */
export const BinaryExampleStep = () => {
  const dispatch = useSterlingDispatch();
  const currentStep = useSterlingSelector(selectSynthesisStep);
  const examples = useSterlingSelector(selectSynthesisExamples);
  const instances = useSterlingSelector(selectSynthesisInstances);
  const numInstances = useSterlingSelector(selectSynthesisNumInstances);
  const datum = useSterlingSelector(selectActiveDatum);
  const currentDataInstance = useSterlingSelector(selectSynthesisCurrentDataInstance);
  const [inputText, setInputText] = useState<string>('');
  const [selectedPairs, setSelectedPairs] = useState<[string, string][]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  const instanceIndex = currentStep - 1;
  const instance = instances[instanceIndex];
  const currentExample = examples.find((ex: any) => ex.instanceIndex === instanceIndex);

  // Initialize from existing example if present, otherwise clear
  useEffect(() => {
    if (currentExample) {
      setSelectedPairs(currentExample.selectedPairs);
      const text = currentExample.selectedPairs
        .map(([a, b]: [string, string]) => `${a}:${b}`)
        .join(', ');
      setInputText(text);
    } else {
      setSelectedPairs([]);
      setInputText('');
      // Clear any existing highlights
      const graphEl = document.querySelector('webcola-cnd-graph');
      if (graphEl && (graphEl as any).clearNodeHighlights) {
        (graphEl as any).clearNodeHighlights();
      }
    }
  }, [instanceIndex, currentExample]);

  // Parse input text but don't update draft until blur
  useEffect(() => {
    setParseError(null);
    
    if (inputText.trim() === '') {
      setSelectedPairs([]);
      return;
    }

    const pairStrings = inputText.split(',').map(p => p.trim()).filter(p => p);
    const pairs: [string, string][] = [];
    
    for (const pairStr of pairStrings) {
      const parts = pairStr.split(':');
      
      if (parts.length !== 2) {
        setParseError(`Invalid pair format: "${pairStr}". Use format: First:Second`);
        return;
      }
      
      const [first, second] = parts.map(id => id.trim());
      
      if (!first || !second) {
        setParseError(`Empty node ID in pair: "${pairStr}"`);
        return;
      }
      
      pairs.push([first, second]);
    }
    
    setSelectedPairs(pairs);
  }, [inputText]);
  
  // Highlight node pairs when input loses focus
  const handleBlur = () => {
    const graphEl = document.querySelector('webcola-cnd-graph');
    if (!graphEl) {
      console.warn('[BinaryExample] Graph element not found');
      return;
    }
    
    // Clear previous highlights
    if ((graphEl as any).clearNodeHighlights) {
      (graphEl as any).clearNodeHighlights();
    }
    
    // Highlight the selected pairs if no parse error
    if (selectedPairs.length > 0 && !parseError && (graphEl as any).highlightNodePairs) {
      const success = (graphEl as any).highlightNodePairs(selectedPairs, { showBadges: true });
      console.log('[BinaryExample] Highlighted pairs:', selectedPairs, 'success:', success);
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
      console.error('[BinaryExample] No data instance available');
      return;
    }
    
    console.log('[BinaryExample] Committing selection:', { instanceIndex, pairs: selectedPairs });
    
    // Commit draft to examples with data instance AND pairs
    dispatch(commitDraftSelection({ 
      instanceIndex, 
      dataInstance: currentDataInstance,
      pairs: selectedPairs 
    }));
    
    // Request next instance from Forge if not the last one
    if (currentStep < numInstances && datum?.generatorName) {
      console.log('[BinaryExample] Requesting next instance from Forge');
      dispatch(buttonClicked({
        id: undefined,
        onClick: "next",
        context: { generatorName: datum.generatorName }
      }));
    }
  };

  const handleRemovePair = (pairIndex: number) => {
    const newPairs = selectedPairs.filter((_, idx) => idx !== pairIndex);
    const newText = newPairs.map(([a, b]) => `${a}:${b}`).join(', ');
    setInputText(newText);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Instructions */}
      <div className="p-4 bg-purple-50 border-b border-purple-200">
        <Text fontSize="sm" fontWeight="semibold" mb={1} color="purple.900">
          Instance {instanceIndex + 1} of {numInstances} - Binary Selector
        </Text>
        <Text fontSize="xs" color="purple.700">
          Enter pairs of atom IDs (format: First:Second) separated by commas.
          <br/>
          Pairs will be highlighted with arrows in the graph.
        </Text>
      </div>

      {/* Text input for pairs */}
      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Pairs (format: First:Second, comma-separated)
          </label>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={handleBlur}
            size="lg"
            fontFamily="monospace"
            isInvalid={parseError !== null}
          />
          {parseError && (
            <Text fontSize="xs" color="red.600" mt={1}>
              {parseError}
            </Text>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Next button */}
      <div className="p-4 border-t bg-gray-50">
        <Button
          w="full"
          colorScheme="purple"
          size="lg"
          onClick={handleNext}
          isDisabled={selectedPairs.length === 0 || parseError !== null}
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
