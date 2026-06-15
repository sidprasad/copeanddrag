import { useSterlingSelector } from '../../state/hooks';
import { selectActiveDatum, selectMainView } from '../../state/selectors';

// Shows the active instance's ID (and command) in the top bar, alongside the
// Graph / Control Panel controls, instead of in a separate strip above the
// graph. Graph view only — other views keep their own headers.
const NavDatumInfo = () => {
  const mainView = useSterlingSelector(selectMainView);
  const datum = useSterlingSelector(selectActiveDatum);

  if (mainView !== 'GraphView' || !datum) return null;

  const command = datum.parsed?.command;

  return (
    <div className='flex min-w-0 max-w-[40vw] items-center gap-2 text-xs'>
      <span className='truncate text-ink-faint' title={datum.id}>
        ID: {datum.id}
      </span>
      {command && (
        <span className='truncate text-ink-muted' title={command}>
          {command}
        </span>
      )}
    </div>
  );
};

export { NavDatumInfo };
