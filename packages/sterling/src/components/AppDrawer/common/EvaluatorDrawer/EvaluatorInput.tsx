import { DatumParsed, evalRequested } from '@/sterling-connection';
import { Icon } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { GoChevronRight } from 'react-icons/go';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../state/hooks';
import {
  selectEvaluatorExpressions,
  selectEvaluatorIsEnabled,
  selectNextExpressionId
} from '../../../../state/selectors';

interface EvaluatorInputProps {
  datum: DatumParsed<any>;
}

const EvaluatorInput = (props: EvaluatorInputProps) => {
  const { datum } = props;
  const [value, setValue] = useState<string>('');
  const [history, setHistory] = useState<number | null>(null);
  const active = useSterlingSelector(selectEvaluatorIsEnabled);
  const nextExpressionId = useSterlingSelector(selectNextExpressionId);
  const expressions = useSterlingSelector((state) =>
    selectEvaluatorExpressions(state, datum)
  );
  const dispatch = useSterlingDispatch();

  const handleChange = useCallback((event) => {
    setHistory(null);
    setValue(event.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (event) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isNonExpressionKeycode(event.code)
      )
        return;
      switch (event.code) {
        case 'ArrowUp':
          if (history === null) {
            if (expressions.length > 0) setHistory(0);
          } else if (history < expressions.length - 1) {
            setHistory(history + 1);
          }
          break;
        case 'ArrowDown':
          if (history !== null) setHistory(history === 0 ? null : history - 1);
          break;
      }
    },
    [expressions, history]
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (value.length > 0) {
        dispatch(
          evalRequested({
            id: `${nextExpressionId}`,
            datumId: datum.id,
            expression: value
          })
        );
        setValue('');
        setHistory(null);
      }
    },
    [datum, nextExpressionId, value]
  );

  const iconColor = active ? 'gray.500' : 'gray.300';
  const placeholder = active ? 'Enter an expression...' : 'Evaluator disabled';

  return (
    <div className='h-[35px] shrink-0'>
      <form className='relative block font-mono' onSubmit={handleSubmit}>
        <span className='sr-only'>Search</span>
        <span className='absolute inset-y-0 left-0 flex items-center pl-2'>
          <Icon color={iconColor} as={GoChevronRight} />
        </span>
        <input
          className='h-[35px] text-xs placeholder:italic placeholder:text-gray-400 placeholder:text-xs block bg-white w-full border-b border-gray-100 focus:border-gray-200 py-2 pl-9 pr-3 focus:outline-none'
          placeholder={placeholder}
          type='text'
          disabled={!active}
          value={history === null ? value : expressions[history].expression}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      </form>
    </div>
  );
};

const NON_EXPRESSION_KEYCODES: string[] = [
  'Unidentified',
  'Escape',
  'Enter',
  'ControlLeft',
  'ControlRight',
  'ShiftLeft',
  'ShiftRight',
  'AltLeft',
  'AltRight',
  'CapsLock',
  'OSLeft',
  'OSRight',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'F10',
  'F11',
  'F12',
  'ScrollLock',
  'ArrowLeft',
  'ArrowRight'
];

function isNonExpressionKeycode(code: string): boolean {
  return NON_EXPRESSION_KEYCODES.includes(code);
}

export { EvaluatorInput };
