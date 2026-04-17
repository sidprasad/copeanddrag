import { CSSProperties, HTMLAttributes } from 'react';
import { TableData } from '../../state/table/table';

interface TableProps {
  data: TableData;
}

const Table = (props: TableProps) => {
  const { data } = props;
  const nrows = data.data.length;
  const ncols = nrows > 0 ? data.data[0].length : 0;

  const style: CSSProperties = {
    gridTemplateColumns: `repeat(${ncols}, minmax(0, 1fr))`,
    borderCollapse: 'collapse',
    textAlign: 'left'
  };
  
  return (
    <table className='prose shadow m-2 boarder prose text-xs font-mono' summary={data.title} role="table" style={style}>
    <caption className='prose prose-sm font-semibold px-2 py-1 border shadow' style={{ textAlign: 'left'}}>{data.title}</caption>
    <thead className='bg-slate-100'>
      <tr>
        {data.headers && data.headers.map((header, index) => {
          return (
            <th
              key={`header-${index}`}
              className='font-semibold px-2 py-0.5'
              scope="col"
              aria-labelledby={header}
            >
              {header}
            </th>
          );
        })}
      </tr>
    </thead>
    <tbody>
      {data.data.map((row, rowIndex) => {
        return (
          <tr key={`row-${rowIndex}`}>
            {row.map((val, colIndex) => {
              return (
                <td
                  className='px-2 py-0.5 bg-white boarder'
                  key={`${rowIndex}${colIndex}`}
                  headers={`header-${colIndex}`}
                >
                  {val}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
  </table>
  );
};

export { Table };
