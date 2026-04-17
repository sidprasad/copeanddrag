import { DatumParsed } from '@/sterling-connection';
import {
  Button,
  Center,
  Menu,
  MenuButton,
  MenuItem,
  MenuList
} from '@chakra-ui/react';
import { keys } from 'lodash-es';
import { useCallback } from 'react';
import { IoMdAddCircleOutline } from 'react-icons/io';
import { projectionAdded } from '../../../../../state/graphs/graphsSlice';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../../state/hooks';
import { selectAvailableProjectableTypes } from '../../../../../state/selectors';

interface AddTimeProjectionButtonProps {
  datum: DatumParsed<any>;
}

const AddTimeProjectionButton = (props: AddTimeProjectionButtonProps) => {
  const { datum } = props;
  const dispatch = useSterlingDispatch();

  // Get Record<string, string[]> mapping types to atoms for types that are
  // not already projected over.
  const available = useSterlingSelector((state) =>
    selectAvailableProjectableTypes(state, datum)
  );
  const types = keys(available);

  // Create a callback that dispatches a projectionAdded action
  const onClick = useCallback(
    (type: string) => {
      const atoms = available[type];
      const atom = atoms[0];
      dispatch(
        projectionAdded({
          datum,
          type,
          atom,
          time: true
        })
      );
    },
    [datum, available]
  );

  if (types.length === 0) return null;

  return (
    <Center my={2}>
      <Menu>
        <MenuButton
          as={Button}
          colorScheme='green'
          size='xs'
          leftIcon={<IoMdAddCircleOutline />}
        >
          Add Time Projection
        </MenuButton>
        <MenuList>
          {types.map((type) => {
            return (
              <MenuItem key={type} onClick={() => onClick(type)}>
                {type}
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </Center>
  );
};

//
// const AddTimeProjectionButton = (props: HTMLAttributes<HTMLDivElement>) => {
//   return (
//     <div
//       className='m-2 p-1 prose prose-sm hover:text-slate-400 active:text-slate-800 cursor-pointer border rounded grid place-content-center'
//       {...props}
//     >
//       Add Time Projection
//     </div>
//   );
// };

export { AddTimeProjectionButton };
