import {
  useActiveDrawerSection,
  useDrawerSections,
  useSetDrawerSection
} from './drawerSections';

// The drawer header's section picker. Replaces the old single-dropdown menu:
// every section for the current view is shown as a labelled tab so controls
// like Time and Layout are discoverable at a glance instead of hidden behind
// a chevron. The strip scrolls horizontally on narrow (embedded) panels.
const DrawerSectionTabs = () => {
  const sections = useDrawerSections();
  const active = useActiveDrawerSection();
  const setSection = useSetDrawerSection();

  return (
    <div
      role='tablist'
      aria-label='Panel sections'
      className='flex min-w-0 flex-1 items-center gap-1 overflow-x-auto'
    >
      {sections.map((section) => {
        const isActive = section.value === active;
        return (
          <button
            key={section.value}
            type='button'
            role='tab'
            aria-selected={isActive}
            title={section.label}
            onClick={() => {
              // Re-picking the open section is a no-op (use the close button to
              // hide the drawer), matching the previous menu behaviour.
              if (!isActive) setSection(section.value);
            }}
            className={[
              'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
              isActive
                ? 'bg-accent-bg text-accent-ink'
                : 'text-ink-muted hover:bg-surface-sunken hover:text-ink'
            ].join(' ')}
          >
            <span className='text-base' aria-hidden='true'>
              {section.icon}
            </span>
            <span>{section.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export { DrawerSectionTabs };
