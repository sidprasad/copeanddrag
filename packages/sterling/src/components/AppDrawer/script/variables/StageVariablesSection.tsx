import { useSterlingSelector } from '../../../../state/hooks';
import {
  selectScriptStage,
  selectScriptStageDimensions
} from '../../../../state/selectors';
import { Row, RowType, RowVariable } from './Row';

const StageVariablesSection = () => {
  const stage = useSterlingSelector(selectScriptStage);
  const size = useSterlingSelector(selectScriptStageDimensions);

  return (
    <div className='flex flex-col justify-middle'>
      <div className='prose prose-md font-bold mx-2 my-2 border-b'>
        Stage Variables
      </div>
      <div className='grid grid-cols-2'>
        <div className='px-4 prose prose-sm font-semibold'>Variable</div>
        <div className='px-4 prose prose-sm font-semibold'>Value</div>
        <Row>
          <RowVariable>{stage}</RowVariable>
          <RowType>
            {stage === 'svg' && (
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://developer.mozilla.org/en-US/docs/Web/SVG'
              >
                {'<svg>'}
              </a>
            )}
            {stage === 'div' && (
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://developer.mozilla.org/en-US/docs/Web/HTML/Element/div'
              >
                {'<div>'}
              </a>
            )}
            {stage === 'canvas' && (
              <a
                target='_blank'
                rel='noopener noreferrer'
                href='https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API'
              >
                {'<canvas>'}
              </a>
            )}
          </RowType>
        </Row>
        <Row>
          <RowVariable>width</RowVariable>
          <RowVariable>{size.width}</RowVariable>
        </Row>
        <Row>
          <RowVariable>height</RowVariable>
          <RowVariable>{size.height}</RowVariable>
        </Row>
      </div>
    </div>
  );
};

export { StageVariablesSection };
