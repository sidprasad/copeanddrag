import { PropsWithChildren } from 'react';

const Row = (props: PropsWithChildren<any>) => (
  <div className='contents group'>{props.children}</div>
);

const RowType = (props: PropsWithChildren<any>) => (
  <div className='px-4 py-0.5 prose text-xs group-hover:bg-slate-100'>
    {props.children}
  </div>
);

const RowVariable = (props: PropsWithChildren<any>) => (
  <div className='px-4 py-0.5 text-xs font-mono group-hover:bg-slate-100'>
    {props.children}
  </div>
);

export { Row, RowType, RowVariable };
