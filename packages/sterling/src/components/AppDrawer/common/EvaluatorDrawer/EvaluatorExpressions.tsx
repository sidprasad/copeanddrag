import { DatumParsed } from '@/sterling-connection';
import { Icon } from '@chakra-ui/react';
import { GoChevronRight } from 'react-icons/go';
import { Expression } from '../../../../state/evaluator/evaluator';
import { useSterlingSelector } from '../../../../state/hooks';
import { selectEvaluatorExpressions } from '../../../../state/selectors';

interface EvaluatorExpressionProps {
  expression: Expression;
}

const EvaluatorExpression = (props: EvaluatorExpressionProps) => {
  const { expression } = props;
  return (
    <div className='relative p-2 font-mono text-xs'>
      <div className='relative flex ml-6'>
        <span className='absolute inset-y-0 -left-5'>
          <Icon as={GoChevronRight} />
        </span>
        <div className='font-semibold select-text'>{expression.expression}</div>
      </div>
      <div className='ml-6 text-gray-600 select-text'>{expression.result}</div>
    </div>
  );
};

interface EvaluatorExpressionsProps {
  datum: DatumParsed<any>;
}

const EvaluatorExpressions = (props: EvaluatorExpressionsProps) => {
  const { datum } = props;
  const expressions = useSterlingSelector((state) =>
    selectEvaluatorExpressions(state, datum)
  );
  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      {expressions.map((expression) => {
        return (
          <EvaluatorExpression key={expression.id} expression={expression} />
        );
      })}
    </div>
  );
};

export { EvaluatorExpressions };
