import { IconButton } from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { selectColorMode } from '../../state/selectors';
import { colorModeToggled } from '../../state/ui/uiSlice';

/**
 * The in-app light/dark switch (available on every view). Dispatches the
 * toggle; the DOM `data-theme`, persistence, and graph sync follow from the
 * store change.
 */
const ThemeToggle = () => {
  const dispatch = useSterlingDispatch();
  const colorMode = useSterlingSelector(selectColorMode);
  const isDark = colorMode === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <IconButton
      aria-label={label}
      title={label}
      icon={isDark ? <SunIcon /> : <MoonIcon />}
      onClick={() => dispatch(colorModeToggled())}
      size='sm'
      variant='ghost'
    />
  );
};

export { ThemeToggle };
