import { ScriptVariable } from '../../../../state/script/script';
import { Row, RowType, RowVariable } from './Row';

interface VariableRowProps {
  variable: ScriptVariable;
}

const VariableRow = (props: VariableRowProps) => {
  const { variable } = props;
  return (
    <Row>
      <RowVariable>{variable.name}</RowVariable>
      <RowType>
        {variable.typeUrl !== undefined ? (
          <a target='_blank' rel='noopener noreferrer' href={variable.typeUrl}>
            {variable.type}
          </a>
        ) : (
          variable.type
        )}
      </RowType>
    </Row>
  );
};

export { VariableRow };
