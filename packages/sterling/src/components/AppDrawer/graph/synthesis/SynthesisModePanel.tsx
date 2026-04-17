import { Button, ButtonGroup, Icon, Progress, Text } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdArrowForward, MdClose, MdScience } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectCanSynthesize,
  selectIsSynthesisActive,
  selectSynthesisError,
  selectSynthesisExamples,
  selectSynthesisInstances,
  selectSynthesisLoading,
  selectSynthesisNumInstances,
  selectSynthesisResult,
  selectSynthesisSelectorType,
  selectSynthesisStep
} from '../../../../state/selectors';
import {
  addSynthesisExample,
  enterSynthesisMode,
  exitSynthesisMode,
  setSynthesisError,
  setSynthesisResult,
  startSynthesis,
  synthesisInstancesLoaded,
  synthesisLoadError,
  synthesisStepBack,
  updateSynthesisExample
} from '../../../../state/synthesis/synthesisSlice';
import { SynthesisSetupStep } from './SynthesisSetupStep';
import { SynthesisExampleStep } from './SynthesisExampleStep';
import { BinaryExampleStep } from './BinaryExampleStep';
import { SynthesisResultStep } from './SynthesisResultStep';
import { PaneTitle } from '@/sterling-ui';
import { getSpytialCore } from '../../../../utils/spytialCore';

/**
 * Main synthesis mode panel - orchestrates the workflow
 */
const SynthesisModePanel = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const isActive = useSterlingSelector(selectIsSynthesisActive);
  const selectorType = useSterlingSelector(selectSynthesisSelectorType);
  const currentStep = useSterlingSelector(selectSynthesisStep);
  const numInstances = useSterlingSelector(selectSynthesisNumInstances);
  const examples = useSterlingSelector(selectSynthesisExamples);
  const instances = useSterlingSelector(selectSynthesisInstances);
  const result = useSterlingSelector(selectSynthesisResult);
  const error = useSterlingSelector(selectSynthesisError);
  const isLoading = useSterlingSelector(selectSynthesisLoading);
  const canSynthesize = useSterlingSelector(selectCanSynthesize); // && false; // Disable synthesis for now (UNCOMMENT TO ALLOW)

  const handleExit = () => {
    dispatch(exitSynthesisMode());
  };

  const handleStartSynthesis = async () => {
    const core = getSpytialCore();
    if (!datum || !core) return;

    dispatch(startSynthesis());

    try {
      // Helper to create AlloyDataInstance from raw instance data
      // We store raw data in Redux (not the class) because class methods don't survive serialization
      const createDataInstance = (rawInstanceData: any) => {
        return new core.AlloyDataInstance(rawInstanceData);
      };

      // Helper to find atom object by ID
      const findAtomById = (dataInstance: any, atomId: string) => {
        const allAtoms = dataInstance.getAtoms();
        console.log('[Synthesis] Looking for atom:', atomId, 'in', allAtoms.length, 'atoms');
        console.log('[Synthesis] Available atom IDs:', allAtoms.map((a: any) => a.id));
        const atom = allAtoms.find((a: any) => a.id === atomId);
        if (!atom) {
          throw new Error(`Atom not found: ${atomId}`);
        }
        return atom;
      };

      if (selectorType === 'unary') {
        // Unary selector synthesis - convert atom IDs to atom objects
        console.log('[Synthesis] Starting unary synthesis with', examples.length, 'examples');
        console.log('[Synthesis] Examples:', examples.map(ex => ({
          instanceIndex: ex.instanceIndex,
          selectedAtomIds: ex.selectedAtomIds,
          hasDataInstance: !!ex.dataInstance
        })));

        const synthesisExamples = examples.map((ex, idx) => {
          const rawInstanceData = ex.dataInstance;
          console.log(`[Synthesis] Example ${idx}: rawInstanceData =`, rawInstanceData);
          if (!rawInstanceData) {
            throw new Error(`Example ${ex.instanceIndex + 1}: Missing data instance`);
          }
          // Recreate AlloyDataInstance from raw data (can't store class in Redux)
          const dataInstance = createDataInstance(rawInstanceData);
          console.log(`[Synthesis] Example ${idx}: recreated AlloyDataInstance with ${dataInstance.getAtoms().length} atoms`);
          const atoms = ex.selectedAtomIds.map(atomId => findAtomById(dataInstance, atomId));
          console.log(`[Synthesis] Example ${idx}: converted ${ex.selectedAtomIds.length} IDs to atoms`);
          return {
            atoms,
            dataInstance
          };
        });

        console.log('[Synthesis] Calling synthesizeAtomSelectorWithExplanation with:', synthesisExamples);
        const result = core.synthesizeAtomSelectorWithExplanation?.(
          synthesisExamples,
          3 // maxDepth
        );
        console.log('[Synthesis] Result:', result);

        if (!result) {
          throw new Error('Synthesis failed - no selector found');
        }

        // Evaluate against all instances to show matches
        const matchesByInstance = examples.map((ex, idx) => {
          const dataInstance = createDataInstance(ex.dataInstance);
          const evaluator = new core.SGraphQueryEvaluator();
          evaluator.initialize({ sourceData: dataInstance });
          const evalResult = evaluator.evaluate(result.expression);
          return {
            instanceIndex: idx,
            matchedAtomIds: evalResult.selectedAtoms ? evalResult.selectedAtoms().map((a: any) => a.id) : []
          };
        });

        dispatch(
          setSynthesisResult({
            expression: result.expression,
            explanation: result.explanation || null,
            matchesByInstance,
            pairMatchesByInstance: []
          })
        );
      } else {
        // Binary selector synthesis - convert pair IDs to atom objects
        const synthesisExamples = examples.map((ex) => {
          const rawInstanceData = ex.dataInstance;
          if (!rawInstanceData) {
            throw new Error(`Example ${ex.instanceIndex + 1}: Missing data instance`);
          }
          const dataInstance = createDataInstance(rawInstanceData);
          const pairs = ex.selectedPairs.map(([srcId, dstId]) => {
            const src = findAtomById(dataInstance, srcId);
            const dst = findAtomById(dataInstance, dstId);
            return [src, dst];
          });
          return {
            pairs,
            dataInstance
          };
        });

        const result = core.synthesizeBinarySelectorWithExplanation?.(
          synthesisExamples,
          3 // maxDepth
        );

        if (!result) {
          throw new Error('Synthesis failed - no binary selector found');
        }

        // Evaluate against all instances
        const pairMatchesByInstance = examples.map((ex, idx) => {
          const dataInstance = createDataInstance(ex.dataInstance);
          const evaluator = new core.SGraphQueryEvaluator();
          evaluator.initialize({ sourceData: dataInstance });
          const evalResult = evaluator.evaluate(result.expression);
          const tuples = evalResult.selectedTuplesAll ? evalResult.selectedTuplesAll() : [];
          return {
            instanceIndex: idx,
            matchedPairs: tuples.map((t: any[]) => [t[0].id, t[1].id] as [string, string])
          };
        });

        dispatch(
          setSynthesisResult({
            expression: result.expression,
            explanation: null,
            matchesByInstance: [],
            pairMatchesByInstance
          })
        );
      }
    } catch (err: any) {
      dispatch(setSynthesisError({ error: err.message || 'Synthesis failed' }));
    }
  };

  // Auto-trigger synthesis when we have all examples and move past the collection step
  const shouldSynthesize = currentStep > numInstances && result === null && !isLoading && !error && examples.length === numInstances;
  
  // Debug: Check why canSynthesize might be false
  const examplesHaveSelections = examples.every((ex: any) => ex.selectedAtomIds.length > 0 || ex.selectedPairs.length > 0);
  
  console.log('[SynthesisPanel] State:', {
    currentStep,
    numInstances,
    result,
    isLoading,
    error,
    examplesLength: examples.length,
    shouldSynthesize,
    canSynthesize,
    examplesHaveSelections,
    examples: examples.map(e => ({ 
      instanceIndex: e.instanceIndex, 
      selectedAtomIds: e.selectedAtomIds,
      selectedPairs: e.selectedPairs,
      hasDataInstance: !!e.dataInstance 
    }))
  });

  useEffect(() => {
    if (shouldSynthesize && canSynthesize) {
      console.log('[SynthesisPanel] Auto-triggering synthesis');
      handleStartSynthesis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldSynthesize, canSynthesize]);

  // Early return AFTER all hooks
  if (!isActive) return null;

  const progress = currentStep === 0 ? 0 : ((currentStep - 1) / numInstances) * 100;
  const isSetupStep = currentStep === 0;
  const isCollectionStep = currentStep >= 1 && currentStep <= numInstances;
  const isResultStep = currentStep > numInstances || result !== null;

  return (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon as={MdScience} boxSize={6} color="blue.600" />
          <div>
            <PaneTitle>Selector Synthesis</PaneTitle>
            <Text fontSize="xs" color="gray.600">
              {isSetupStep && 'Configure synthesis parameters'}
              {isCollectionStep && `Collecting examples (${examples.length}/${numInstances})`}
              {isResultStep && 'Review synthesized selector'}
            </Text>
          </div>
        </div>
        <Button
          size="sm"
          leftIcon={<MdClose />}
          onClick={handleExit}
          variant="ghost"
        >
          Exit
        </Button>
      </div>

      {/* Progress bar */}
      {!isSetupStep && !isResultStep && (
        <Progress value={progress} size="xs" colorScheme="blue" />
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {isSetupStep && <SynthesisSetupStep />}
        {isCollectionStep && (selectorType === 'unary' ? <SynthesisExampleStep /> : <BinaryExampleStep />)}
        {isResultStep && <SynthesisResultStep />}
      </div>

      {/* Footer actions */}
      {!isSetupStep && !isResultStep && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <Button
            size="sm"
            leftIcon={<MdArrowBack />}
            onClick={() => dispatch(synthesisStepBack())}
            isDisabled={currentStep <= 1}
            variant="outline"
          >
            Previous
          </Button>

          <Text fontSize="sm" color="gray.600">
            Instance {currentStep} of {numInstances}
          </Text>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default SynthesisModePanel;

const SynthesisModePanelHeader = () => {
  return (
    <div className="w-full flex items-center px-2 space-x-2">
      <PaneTitle>Synthesis</PaneTitle>
    </div>
  );
};

export { SynthesisModePanel, SynthesisModePanelHeader };
