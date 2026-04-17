import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Code,
  HStack,
  Text,
  VStack
} from '@chakra-ui/react';
import { MdArrowForward, MdCheck, MdClose } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import {
  selectActiveDatum,
  selectCnDSpec,
  selectSynthesisExamples,
  selectSynthesisResult,
  selectSynthesisSelectorType
} from '../../../../state/selectors';
import { cndSpecSet } from '../../../../state/graphs/graphsSlice';
import { exitSynthesisMode } from '../../../../state/synthesis/synthesisSlice';

/**
 * Results step - show synthesized selector and matches
 */
export const SynthesisResultStep = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const result = useSterlingSelector(selectSynthesisResult);
  const selectorType = useSterlingSelector(selectSynthesisSelectorType);
  const examples = useSterlingSelector(selectSynthesisExamples);
  const cndSpec = useSterlingSelector((state) =>
    datum ? selectCnDSpec(state, datum) : ''
  );

  if (!result || !datum) {
    return (
      <div className="p-8 text-center">
        <Text color="gray.500">No synthesis result available</Text>
      </div>
    );
  }

  const handleAccept = () => {
    // Insert the synthesized selector into the CnD spec
    // User can choose how to use it (in constraints, directives, etc.)
    const newSpec = cndSpec
      ? `${cndSpec}\n\n# Synthesized ${selectorType} selector\n# ${result.expression}\n`
      : `# Synthesized ${selectorType} selector\n# ${result.expression}\n`;

    dispatch(cndSpecSet({ datum, spec: newSpec }));
    dispatch(exitSynthesisMode());
  };

  const handleReject = () => {
    dispatch(exitSynthesisMode());
  };

  const isUnary = selectorType === 'unary';
  const matchData = isUnary ? result.matchesByInstance : result.pairMatchesByInstance;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <VStack spacing={6} align="stretch">
        {/* Synthesized selector */}
        <Box borderWidth={2} borderColor="green.500" rounded="lg" p={4} bg="green.50">
          <Text fontSize="sm" fontWeight="semibold" color="green.700" mb={2}>
            Synthesized {isUnary ? 'Unary' : 'Binary'} Selector
          </Text>
          <Code
            p={3}
            rounded="md"
            fontSize="lg"
            fontWeight="bold"
            display="block"
            bg="white"
          >
            {result.expression}
          </Code>
        </Box>

        {/* Match summary */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={3}>
            Matches Across Instances
          </Text>
          <Accordion allowMultiple>
            {matchData.map((match, idx) => {
              const example = examples[idx];
              let allMatch = false;

              if (isUnary) {
                const unaryMatch = match as { instanceIndex: number; matchedAtomIds: string[] };
                allMatch =
                  example &&
                  example.selectedAtomIds.every((id) => unaryMatch.matchedAtomIds.includes(id)) &&
                  example.selectedAtomIds.length === unaryMatch.matchedAtomIds.length;
              } else {
                const binaryMatch = match as {
                  instanceIndex: number;
                  matchedPairs: [string, string][];
                };
                const selectedPairs = example?.selectedPairs || [];
                allMatch =
                  selectedPairs.every(([a, b]) =>
                    binaryMatch.matchedPairs.some(
                      ([ma, mb]) => (ma === a && mb === b) || (ma === b && mb === a)
                    )
                  ) && selectedPairs.length === binaryMatch.matchedPairs.length;
              }

              const matchCount = isUnary
                ? (match as any).matchedAtomIds.length
                : (match as any).matchedPairs.length;

              return (
                <AccordionItem key={match.instanceIndex}>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <HStack>
                          <Text fontWeight="semibold">Instance {match.instanceIndex + 1}</Text>
                          <Badge colorScheme={allMatch ? 'green' : 'yellow'}>
                            {matchCount} matches
                          </Badge>
                          {allMatch ? (
                            <Badge colorScheme="green">
                              <MdCheck /> Exact
                            </Badge>
                          ) : (
                            <Badge colorScheme="yellow">Partial</Badge>
                          )}
                        </HStack>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {isUnary ? (
                      <VStack align="stretch" spacing={2}>
                        <div>
                          <Text fontSize="sm" fontWeight="semibold" mb={1}>
                            You selected:
                          </Text>
                          <div className="flex flex-wrap gap-1">
                            {example?.selectedAtomIds.map((id) => (
                              <Badge key={id} colorScheme="blue">
                                {id}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Text fontSize="sm" fontWeight="semibold" mb={1}>
                            Selector matches:
                          </Text>
                          <div className="flex flex-wrap gap-1">
                            {(match as any).matchedAtomIds.map((id: string) => (
                              <Badge
                                key={id}
                                colorScheme={
                                  example?.selectedAtomIds.includes(id) ? 'green' : 'orange'
                                }
                              >
                                {id}
                                {!example?.selectedAtomIds.includes(id) && ' (extra)'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </VStack>
                    ) : (
                      <VStack align="stretch" spacing={2}>
                        <div>
                          <Text fontSize="sm" fontWeight="semibold" mb={1}>
                            You selected:
                          </Text>
                          <VStack align="stretch" spacing={1}>
                            {example?.selectedPairs.map(([a, b], pidx) => (
                              <HStack key={pidx}>
                                <Badge colorScheme="blue">{a}</Badge>
                                <MdArrowForward />
                                <Badge colorScheme="blue">{b}</Badge>
                              </HStack>
                            ))}
                          </VStack>
                        </div>
                        <div>
                          <Text fontSize="sm" fontWeight="semibold" mb={1}>
                            Selector matches:
                          </Text>
                          <VStack align="stretch" spacing={1}>
                            {(match as any).matchedPairs.map(([a, b]: [string, string], pidx: number) => {
                              const isExpected = example?.selectedPairs.some(
                                ([ea, eb]) => (ea === a && eb === b) || (ea === b && eb === a)
                              );
                              return (
                                <HStack key={pidx}>
                                  <Badge colorScheme={isExpected ? 'green' : 'orange'}>{a}</Badge>
                                  <MdArrowForward />
                                  <Badge colorScheme={isExpected ? 'green' : 'orange'}>{b}</Badge>
                                  {!isExpected && <Text fontSize="xs">(extra)</Text>}
                                </HStack>
                              );
                            })}
                          </VStack>
                        </div>
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              );
            })}
          </Accordion>
        </Box>

        {/* Actions */}
        <HStack spacing={3} pt={4}>
          <Button
            flex={1}
            colorScheme="green"
            leftIcon={<MdCheck />}
            onClick={handleAccept}
            size="lg"
          >
            Accept & Insert into Spec
          </Button>
          <Button
            flex={1}
            variant="outline"
            leftIcon={<MdClose />}
            onClick={handleReject}
            size="lg"
          >
            Reject & Try Again
          </Button>
        </HStack>

        {/* Usage hint */}
        <Box bg="blue.50" p={4} rounded="md" borderWidth={1} borderColor="blue.200">
          <Text fontSize="sm" color="gray.700">
            <strong>Next steps:</strong> The selector will be added as a comment in your CnD
            spec. You can use it in constraints (e.g., <Code>right({result.expression})</Code>)
            or directives (e.g., <Code>color red({result.expression})</Code>).
          </Text>
        </Box>
      </VStack>
    </div>
  );
};
