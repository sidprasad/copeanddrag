import { DatumParsed } from '@/sterling-connection';
import { useCallback, MouseEvent } from 'react';
import { activeDatumSet } from '../../../../../state/data/dataSlice';
import { useSterlingDispatch } from '../../../../../state/hooks';
import { ListViewDatumItem } from './ListViewDatumItem';

interface ListViewDataProps {
  data: DatumParsed<any>[];
  active: DatumParsed<any> | undefined;
}

const ListViewData = (props: ListViewDataProps) => {
  const { data, active } = props;
  const dispatch = useSterlingDispatch();

  const onClickRow = useCallback(
    (event: MouseEvent, datum: DatumParsed<any>) => {
      dispatch(activeDatumSet(datum.id));
    },
    []
  );

  return (
    <div className='w-full grid grid-cols-[minmax(max-content,auto)_repeat(2,min-content)]'>
      {data
      .map((datum) => {
        const { id } = datum;
        return (
          <ListViewDatumItem
            key={id}
            datum={datum}
            active={datum === active}
            onClickItem={onClickRow}
          />
        );
      })}
    </div>
  );
};

export { ListViewData };
