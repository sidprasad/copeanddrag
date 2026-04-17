import { MinimapControls } from './MinimapControls';
import { MinimapGraph } from './MinimapGraph';

export interface MinimapProps {
  // whether to show only controls or controls plus minimap
  collapsed: boolean;
  // the currently active index
  current: number;
  // the total number of states
  length: number;
  // the loopback index, if one exists
  loopBack?: number;
  // a function that returns the label to display given the current index
  label: (index: number) => string;
  // a callback to call when the index is changed by the user
  onChange: (index: number) => void;
  // a callback to call when the user clicks the collapse button
  onToggleCollapse: () => void;
}

const Minimap = (props: MinimapProps) => {
  const { collapsed } = props;
  return (
    <div className='border rounded mx-2'>
      <MinimapControls {...props} />
      {!collapsed && <MinimapGraph {...props} />}
    </div>
  );
};

export { Minimap };
