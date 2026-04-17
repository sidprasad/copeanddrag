import { DatumParsed } from '@/sterling-connection';
import { Projection } from '@/sterling-theme';
import {
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select
} from '@chakra-ui/react';
import { ChangeEvent, useCallback, useState } from 'react';
import { MdChevronLeft, MdChevronRight, MdClose } from 'react-icons/md';
import {
  hiddenRelationAdded,
  projectionOrderingSet,
  projectionRemoved,
  projectionSet
} from '../../../../../state/graphs/graphsSlice';
import { useSterlingDispatch } from '../../../../../state/hooks';

interface ItemProps {
  type: string;
  atom: string | undefined;
  atoms: string[];
  relation: string | undefined;
  relations: string[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onRelation: (relation: string | undefined) => void;
  onHiddenRelation: (relation: string) => void;
  onRemove: () => void;
  onToggle: () => void;
}

const TimeProjectionsListRow = (props: ItemProps) => {
  const {
    type,
    atom,
    atoms,
    onChange,
    onNext,
    onPrevious,
    onRemove,
    onToggle
  } = props;
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
        <MdChevronLeft
          className='-rotate-90 ml-2 cursor-pointer hover:text-black'
          onClick={onToggle}
        />
      </div>
    </>
  );
};

const TimeProjectionCard = (props: ItemProps) => {
  const {
    type,
    atom,
    atoms,
    relation,
    relations,
    onChange,
    onNext,
    onPrevious,
    onRelation,
    onRemove,
    onToggle
  } = props;

  return (
    <div className='m-2 col-span-3 flex flex-col border shadow'>
      <div className='flex justify-between p-3 bg-slate-50'>
        <div className='text-sm font-bold'>{type}</div>
        <MdChevronLeft
          className='rotate-90 cursor-pointer hover:text-black'
          onClick={onToggle}
        />
      </div>
      <div className='w-full mt-3 px-3 flex items-center'>
        <ButtonGroup className='grow' size='xs' isAttached>
          <Button
            className='grow'
            aria-label='Previous'
            leftIcon={<MdChevronLeft />}
            onClick={onPrevious}
          >
            Previous
          </Button>
          <div className='flex items-center -mt-0.5'>
            <Select size='xs' value={atom} onChange={onChange}>
              {atoms.map((atom) => {
                return (
                  <option key={atom} value={atom}>
                    {atom}
                  </option>
                );
              })}
            </Select>
          </div>
          <Button
            className='grow'
            aria-label='Next'
            rightIcon={<MdChevronRight />}
            onClick={onNext}
          >
            Next
          </Button>
        </ButtonGroup>
      </div>
      <div className='w-full mt-3 px-3 flex items-center'>
        <div className='text-sm whitespace-nowrap pr-3'>Ordering Relation:</div>
        <Select size='xs'>
          <option>None</option>
        </Select>
      </div>
    </div>
  );
};

const TimeProjectionsListCard = (props: ItemProps) => {
  const {
    type,
    atom,
    atoms,
    relation,
    relations,
    onChange,
    onNext,
    onPrevious,
    onRelation,
    onRemove,
    onToggle,
    onHiddenRelation
  } = props;
  return (
    <div className='m-2 p-2 col-span-3 flex flex-col border shadow'>
      <div className='flex justify-between pb-3'>
        <div className='text-sm font-bold'>{type}</div>
        <MdChevronLeft
          className='rotate-90 cursor-pointer hover:text-black'
          onClick={onToggle}
        />
      </div>
      <div className='px-2 grid grid-cols-[minmax(max-content,auto)_minmax(max-content,auto)]'>
        <Select size='xs' value={atom} onChange={onChange}>
          {atoms.map((atom) => {
            return (
              <option key={atom} value={atom}>
                {atom}
              </option>
            );
          })}
        </Select>
        <div className='mt-0.5 flex items-center justify-end'>
          <ButtonGroup className='px-2' size='xs' isAttached>
            <Button
              aria-label='Previous'
              leftIcon={<MdChevronLeft />}
              onClick={onPrevious}
            >
              Previous
            </Button>
            <Button
              aria-label='Next'
              rightIcon={<MdChevronRight />}
              onClick={onNext}
            >
              Next
            </Button>
          </ButtonGroup>
        </div>
      </div>
      <div className='px-2 pt-2'>
        {relation ? (
          <div className='px-2 text-sm flex justify-between items-center'>
            <div>
              <span className='font-semibold'>{relation}</span> defines total
              order
            </div>
            <MdClose onClick={() => onRelation(undefined)} />
          </div>
        ) : (
          <Menu matchWidth>
            <MenuButton as={Button} width='full' size='xs' py={4}>
              Select Ordering Relation
            </MenuButton>
            <MenuList>
              {relations.map((relation) => {
                return (
                  <MenuItem key={relation} onClick={() => onRelation(relation)}>
                    {relation}
                  </MenuItem>
                );
              })}
            </MenuList>
          </Menu>
        )}
      </div>
      <div className='p-2'>
        <Menu matchWidth>
          <MenuButton as={Button} width='full' size='xs' py={4}>
            Hide a Relation
          </MenuButton>
          <MenuList>
            {relations.map((relation) => {
              return (
                <MenuItem
                  key={relation}
                  onClick={() => onHiddenRelation(relation)}
                >
                  {relation}
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      </div>
      <div className='p-2'>
        <Button
          aria-label='Remove'
          width='full'
          size='xs'
          py={4}
          colorScheme='red'
          leftIcon={<MdClose />}
          onClick={onRemove}
        >
          Remove Projection
        </Button>
      </div>
    </div>
  );
};

interface TimeProjectionsListItemProps {
  datum: DatumParsed<any>;
  projection: Projection;
  atoms: string[];
  relations: string[];
}

const TimeProjectionListItem = (props: TimeProjectionsListItemProps) => {
  const { datum, projection, atoms, relations } = props;
  const { type, atom, timeOrdering } = projection;
  const [isCard, setIsCard] = useState(false);
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

  const onRelation = useCallback(
    (relation: string | undefined) => {
      dispatch(
        projectionOrderingSet({
          datum,
          type,
          relation
        })
      );
    },
    [datum, type]
  );

  const onHiddenRelation = useCallback(
    (relation: string) => {
      dispatch(
        hiddenRelationAdded({
          datum,
          type,
          relation
        })
      );
    },
    [datum, type]
  );

  const onToggle = useCallback(() => {
    setIsCard((state) => !state);
  }, [setIsCard]);

  return isCard ? (
    <TimeProjectionsListCard
      type={type}
      atom={atom}
      atoms={atoms}
      relation={timeOrdering}
      relations={relations}
      onChange={onChange}
      onNext={onNext}
      onPrevious={onPrevious}
      onRemove={onRemove}
      onRelation={onRelation}
      onToggle={onToggle}
      onHiddenRelation={onHiddenRelation}
    />
  ) : (
    <TimeProjectionsListRow
      type={type}
      atom={atom}
      atoms={atoms}
      relation={timeOrdering}
      relations={relations}
      onChange={onChange}
      onNext={onNext}
      onPrevious={onPrevious}
      onRemove={onRemove}
      onRelation={onRelation}
      onToggle={onToggle}
      onHiddenRelation={onHiddenRelation}
    />
  );
};

export { TimeProjectionListItem };
