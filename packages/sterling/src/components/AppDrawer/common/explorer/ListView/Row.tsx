import { HTMLAttributes } from 'react';

const Row = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, onClick, ...rest } = props;
  return (
    <div
      className={`contents ${onClick ? 'group' : ''} ${className || ''}`}
      onClick={onClick}
      {...rest}
    />
  );
};

const RowItem = (props: HTMLAttributes<HTMLDivElement>) => {
  const { className, ...rest } = props;
  return (
    <div
      className={`
        flex items-center prose prose-sm truncate px-1 py-0.5 first:pl-2 last:pr-2 group-hover:bg-accent group-active:bg-accent group-hover:text-on-accent select-none cursor-default group-hover:cursor-pointer ${
          className || ''
        }`}
      {...rest}
    />
  );
};

export { Row, RowItem };
