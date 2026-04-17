import { DatumParsed } from '@/sterling-connection';
import { useSterlingSelector } from '../../state/hooks';
import { selectTables } from '../../state/selectors';
import { Table } from './Table';

interface TableViewDatumProps {
  datum: DatumParsed<any>;
}

const TableViewDatum = (props: TableViewDatumProps) => {
  const { datum } = props;
  const tableData = useSterlingSelector((state) => selectTables(state, datum));
  return (
    <>
      {tableData.map((table, index) => {
        return <Table key={index} data={table} />;
      })}
    </>
  );
};

export { TableViewDatum };
