import {
  Badge,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Textarea,
  useToast
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import type { CndPatch } from '../../../../utils/layoutSuggestions';
import type {
  LlmMessage,
  LlmProviderConfig,
  NlAuthoringResult,
  NlProgressEvent
} from '../../../../nlAuthoring';
import {
  clearLlmConfig,
  loadLlmConfig,
  saveLlmConfig
} from '../../../../utils/llmSettings';

interface DescribeLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Run the NL engine with the given connection; supplied by the drawer. */
  runTranslate: (
    config: LlmProviderConfig,
    utterance: string,
    priorTranscript: LlmMessage[] | undefined,
    onProgress: (event: NlProgressEvent) => void
  ) => Promise<NlAuthoringResult>;
  /** Merge the accepted patches into the editor + graph; supplied by the drawer. */
  applyPatches: (patches: CndPatch[]) => void;
}

type Phase = 'input' | 'working' | 'clarification' | 'proposal' | 'failed';

const PLACEHOLDER = 'e.g. All binary tree children should be below their parents';

const DECISION_COLORS: Record<string, string> = {
  applied: 'green',
  weakened: 'yellow',
  omitted: 'red'
};

export function DescribeLayoutModal({
  isOpen,
  onClose,
  runTranslate,
  applyPatches
}: DescribeLayoutModalProps) {
  const toast = useToast();

  const [config, setConfig] = useState<LlmProviderConfig | undefined>(undefined);
  const [showConfig, setShowConfig] = useState(false);
  const [kind, setKind] = useState<'openai-compatible' | 'anthropic'>('openai-compatible');
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');

  const [phase, setPhase] = useState<Phase>('input');
  const [utterance, setUtterance] = useState('');
  const [answer, setAnswer] = useState('');
  const [progress, setProgress] = useState<string[]>([]);
  const [result, setResult] = useState<NlAuthoringResult | undefined>(undefined);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    const stored = loadLlmConfig();
    setConfig(stored);
    setShowConfig(!stored);
    if (stored) {
      setKind(stored.kind);
      setModel(stored.model);
      setApiKey(stored.apiKey);
      if (stored.kind === 'openai-compatible') setBaseUrl(stored.baseUrl);
    }
  }, [isOpen]);

  const reset = useCallback(() => {
    setPhase('input');
    setProgress([]);
    setResult(undefined);
    setSelected(new Set());
    setAnswer('');
  }, []);

  const close = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const saveConnection = useCallback(() => {
    const next: LlmProviderConfig =
      kind === 'openai-compatible'
        ? { kind, baseUrl: baseUrl.trim(), apiKey: apiKey.trim(), model: model.trim() }
        : { kind, apiKey: apiKey.trim(), model: model.trim() };
    saveLlmConfig(next);
    setConfig(next);
    setShowConfig(false);
  }, [apiKey, baseUrl, kind, model]);

  const forgetConnection = useCallback(() => {
    clearLlmConfig();
    setConfig(undefined);
    setApiKey('');
    setShowConfig(true);
  }, []);

  const handleResult = useCallback((outcome: NlAuthoringResult) => {
    setResult(outcome);
    if (outcome.status === 'needsClarification') {
      setPhase('clarification');
    } else if (outcome.status === 'ok') {
      setSelected(
        new Set(
          outcome.candidates
            .map((candidate, index) => (candidate.decision === 'omitted' ? -1 : index))
            .filter((index) => index >= 0)
        )
      );
      setPhase('proposal');
    } else {
      setPhase('failed');
    }
  }, []);

  const translate = useCallback(
    async (text: string, priorTranscript?: LlmMessage[]) => {
      if (!config || !text.trim()) return;
      setPhase('working');
      setProgress([]);
      try {
        const outcome = await runTranslate(config, text.trim(), priorTranscript, (event) =>
          setProgress((lines) => [...lines, event.message])
        );
        handleResult(outcome);
      } catch (error) {
        setResult({
          status: 'failed',
          transcript: [],
          candidates: [],
          diagnostics: [error instanceof Error ? error.message : String(error)],
          llmCallsUsed: 0
        });
        setPhase('failed');
      }
    },
    [config, handleResult, runTranslate]
  );

  const apply = useCallback(() => {
    if (!result) return;
    const patches = result.candidates
      .filter((candidate, index) => selected.has(index) && candidate.decision !== 'omitted')
      .map(({ patch }) => patch);
    if (patches.length === 0) return;
    try {
      applyPatches(patches);
      toast({
        variant: 'top-accent',
        position: 'bottom-right',
        title: 'Layout updated',
        description: `${patches.length} change(s) applied to the spec.`,
        status: 'success',
        duration: 5000,
        isClosable: true
      });
      close();
    } catch (error) {
      toast({
        variant: 'top-accent',
        position: 'bottom-right',
        title: 'Could not apply the layout',
        description: error instanceof Error ? error.message : 'Unknown error.',
        status: 'error',
        duration: 10000,
        isClosable: true
      });
    }
  }, [applyPatches, close, result, selected, toast]);

  const toggleSelected = useCallback((index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={close} size="2xl">
      <ModalOverlay />
      <ModalContent maxW="46rem">
        <ModalHeader>Describe a layout</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={4}>
          {/* Connection section */}
          <FormControl mb={4}>
            <FormLabel mb={1}>
              LLM connection{' '}
              {config && (
                <Button size="xs" variant="link" onClick={() => setShowConfig((v) => !v)}>
                  {showConfig ? 'hide' : `(${config.model} — edit)`}
                </Button>
              )}
            </FormLabel>
            {showConfig && (
              <>
                <Select
                  size="sm"
                  mb={2}
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as 'openai-compatible' | 'anthropic')
                  }
                >
                  <option value="openai-compatible">
                    OpenAI-compatible (OpenAI, Ollama, LM Studio, OpenRouter, …)
                  </option>
                  <option value="anthropic">Anthropic</option>
                </Select>
                {kind === 'openai-compatible' && (
                  <Input
                    size="sm"
                    mb={2}
                    placeholder="Base URL, e.g. https://api.openai.com/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                )}
                <Input
                  size="sm"
                  mb={2}
                  type="password"
                  placeholder={
                    kind === 'anthropic' ? 'API key' : 'API key (empty for local servers)'
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Input
                  size="sm"
                  mb={2}
                  placeholder={kind === 'anthropic' ? 'Model, e.g. claude-sonnet-5' : 'Model, e.g. gpt-5 or llama3.2'}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
                <Button size="sm" mr={2} onClick={saveConnection} isDisabled={!model.trim()}>
                  Save connection
                </Button>
                {config && (
                  <Button size="sm" variant="ghost" onClick={forgetConnection}>
                    Forget
                  </Button>
                )}
                <FormHelperText>
                  Stored unencrypted in this browser only; requests go directly from your
                  browser to the endpoint above.
                </FormHelperText>
              </>
            )}
          </FormControl>

          {phase === 'input' && (
            <FormControl>
              <FormLabel>What should the layout look like?</FormLabel>
              <Textarea
                minH="6rem"
                placeholder={PLACEHOLDER}
                value={utterance}
                onChange={(e) => setUtterance(e.target.value)}
              />
            </FormControl>
          )}

          {phase === 'working' && (
            <div>
              <Spinner size="sm" mr={2} />
              <Text as="span">Translating…</Text>
              {progress.map((line, index) => (
                <Text key={index} fontSize="sm" color="gray.500" mt={1}>
                  {line}
                </Text>
              ))}
            </div>
          )}

          {phase === 'clarification' && result && (
            <FormControl>
              <FormLabel>{result.question}</FormLabel>
              <Textarea
                minH="4rem"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer…"
              />
            </FormControl>
          )}

          {phase === 'proposal' && result && (
            <div>
              {result.interpretation && (
                <Text mb={3} fontStyle="italic">
                  “{result.interpretation}”
                </Text>
              )}
              {result.candidates.map((candidate, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid var(--chakra-colors-gray-200)',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12
                  }}
                >
                  <Checkbox
                    isChecked={selected.has(index)}
                    isDisabled={candidate.decision === 'omitted'}
                    onChange={() => toggleSelected(index)}
                  >
                    <Badge colorScheme={DECISION_COLORS[candidate.decision]} mr={2}>
                      {candidate.decision}
                    </Badge>
                    {candidate.rationale}
                  </Checkbox>
                  {candidate.decisionReason && (
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      {candidate.decisionReason}
                    </Text>
                  )}
                  {candidate.warnings.map((warning, warningIndex) => (
                    <Text key={warningIndex} fontSize="sm" color="orange.500" mt={1}>
                      ⚠ {warning}
                    </Text>
                  ))}
                  <Textarea
                    mt={2}
                    fontFamily="mono"
                    fontSize="xs"
                    isReadOnly
                    minH="5rem"
                    value={candidate.renderedYaml}
                  />
                </div>
              ))}
              {result.diagnostics.map((line, index) => (
                <Text key={index} fontSize="sm" color="gray.500">
                  {line}
                </Text>
              ))}
            </div>
          )}

          {phase === 'failed' && result && (
            <div>
              <Text color="red.500" mb={2}>
                The intent could not be translated into a valid layout.
              </Text>
              {result.diagnostics.map((line, index) => (
                <Text key={index} fontSize="sm" color="gray.500">
                  {line}
                </Text>
              ))}
              {result.candidates.map((candidate, index) => (
                <Text key={`c${index}`} fontSize="sm" color="gray.500" mt={1}>
                  {candidate.rationale} — {candidate.decisionReason ?? candidate.decision}
                </Text>
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {phase === 'input' && (
            <Button
              colorScheme="blue"
              onClick={() => translate(utterance)}
              isDisabled={!config || !utterance.trim()}
            >
              Translate
            </Button>
          )}
          {phase === 'clarification' && result && (
            <Button
              colorScheme="blue"
              onClick={() => translate(answer, result.transcript)}
              isDisabled={!answer.trim()}
            >
              Continue
            </Button>
          )}
          {phase === 'proposal' && (
            <>
              <Button variant="ghost" mr={2} onClick={reset}>
                Start over
              </Button>
              <Button colorScheme="blue" onClick={apply} isDisabled={selected.size === 0}>
                Apply selected
              </Button>
            </>
          )}
          {phase === 'failed' && (
            <Button onClick={() => setPhase('input')}>Edit and retry</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
