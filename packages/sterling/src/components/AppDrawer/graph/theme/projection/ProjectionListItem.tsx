import { DatumParsed } from '@/sterling-connection';
import { Projection } from '@/sterling-theme';
import { ButtonGroup, IconButton, Select } from '@chakra-ui/react';
import { ChangeEvent, useCallback } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import {
  projectionRemoved,
  projectionSet
} from '../../../../../state/graphs/graphsSlice';
import { useSterlingDispatch } from '../../../../../state/hooks';

interface ProjectionRowProps {
  datum: DatumParsed<any>;
  projection: Projection;
  atoms: string[];
}

const ProjectionListItem = (props: ProjectionRowProps) => {
  const { datum, projection, atoms } = props;
  const { type, atom } = projection;
  const dispatch = useSterlingDispatch();

  const onChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const atom = event.target.value;
      dispatch(
        projectionSet({
          datum,
          type,
          atom
        })
      );
    },
    [datum, type]
  );

  const onPrevious = useCallback(() => {
    if (atom) {
      const current = atoms.indexOf(atom);
      if (current > 0)
        dispatch(
          projectionSet({
            datum,
            type,
            atom: atoms[current - 1]
          })
        );
    }
  }, [datum, type, atoms, atom]);

  const onRemove = useCallback(() => {
    dispatch(
      projectionRemoved({
        datum,
        type
      })
    );
  }, [datum, type]);

  const onNext = useCallback(() => {
    if (atom) {
      const current = atoms.indexOf(atom);
      if (current !== -1 && current < atoms.length - 1)
        dispatch(
          projectionSet({
            datum,
            type,
            atom: atoms[current + 1]
          })
        );
    }
  }, [datum, type, atoms, atom]);

  return (
    <>
      <div className='text-sm px-2 flex items-center align-middle'>{type}</div>
      <div className='flex items-center'>
        <Select
          className='flex items-center'
          size='xs'
          value={atom}
          onChange={onChange}
        >
          {atoms.map((atom) => {
            return (
              <option key={atom} value={atom}>
                {atom}
              </option>
            );
          })}
        </Select>
      </div>
      <div className='px-2 flex items-center justify-end'>
        <ButtonGroup size='xs' isAttached>
          <IconButton
            aria-label='Previous'
            icon={<MdChevronLeft />}
            onClick={onPrevious}
          />
          <IconButton
            aria-label='Remove'
            icon={<MdClose />}
            onClick={onRemove}
          />
          <IconButton
            aria-label='Next'
            icon={<MdChevronRight />}
            onClick={onNext}
          />
        </ButtonGroup>
      </div>
    </>
  );
};

export { ProjectionListItem };
