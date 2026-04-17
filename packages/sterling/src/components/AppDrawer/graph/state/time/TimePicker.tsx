import { DatumParsed } from '@/sterling-connection';
import { useCallback, useState } from 'react';
import { timeIndexSet, timeIndexToggled, selectedTimeIndicesSet } from '../../../../../state/graphs/graphsSlice';
import {
  useSterlingDispatch,
  useSterlingSelector
} from '../../../../../state/hooks';
import {
  selectLoopbackIndex,
  selectTimeIndex,
  selectTraceLength,
  selectSelectedTimeIndices
} from '../../../../../state/selectors';
import { Minimap } from '../../../../Minimap/Minimap';

const TimePicker = ({ datum }: { datum: DatumParsed<any> }) => {
  const dispatch = useSterlingDispatch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  const timeIndex = useSterlingSelector((state) =>
    selectTimeIndex(state, datum)
  );
  const traceLength = useSterlingSelector((state) =>
    selectTraceLength(state, datum)
  );
  const loopBack = useSterlingSelector((state) =>
    selectLoopbackIndex(state, datum)
  );
  const selectedTimeIndices = useSterlingSelector((state) =>
    selectSelectedTimeIndices(state, datum)
  );

  const indexSet = useCallback(
    (index: number) => {
      if (isMultiSelectMode) {
        // In multi-select mode, toggle the index
        dispatch(timeIndexToggled({ datum, index }));
      } else {
        // In single-select mode, set the time index normally
        dispatch(timeIndexSet({ datum, index }));
      }
    },
    [datum, dispatch, isMultiSelectMode]
  );

  const toggleMultiSelectMode = useCallback(() => {
    const newMode = !isMultiSelectMode;
    setIsMultiSelectMode(newMode);
    
    if (newMode) {
      // Entering multi-select mode: initialize with current time index
      dispatch(selectedTimeIndicesSet({ datum, selectedIndices: [timeIndex] }));
    } else {
      // Leaving multi-select mode: clear the multi-select state
      dispatch(selectedTimeIndicesSet({ datum, selectedIndices: [] }));
    }
  }, [isMultiSelectMode, dispatch, datum, timeIndex]);

  const selectAllTimeIndices = useCallback(() => {
    const allIndices = Array.from({ length: traceLength }, (_, i) => i);
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: allIndices }));
  }, [dispatch, datum, traceLength]);

  const selectFirstLast = useCallback(() => {
    const indices = traceLength > 1 ? [0, traceLength - 1] : [0];
    dispatch(selectedTimeIndicesSet({ datum, selectedIndices: indices }));
  }, [dispatch, datum, traceLength]);

  return (
    <div className='mx-1 my-2'>
      {/* Multi-select toggle for traces with multiple states */}
      {traceLength > 1 && (
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleMultiSelectMode}
            className={`
              px-2 py-1 text-xs rounded-md transition-all font-medium
              ${isMultiSelectMode 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }
            `}
          >
            {isMultiSelectMode ? '✓ Compare Mode' : 'Compare States'}
          </button>
          
          {isMultiSelectMode && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectFirstLast}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              >
                First & Last
              </button>
              <button
                type="button"
                onClick={selectAllTimeIndices}
                className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              >
                All
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Multi-select time step buttons */}
      {isMultiSelectMode && (
        <div className="mb-2">
          <p className="text-xs text-gray-500 mb-1.5">
            Click states to compare side-by-side:
          </p>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: traceLength }, (_, i) => {
              const isSelected = selectedTimeIndices.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => dispatch(timeIndexToggled({ datum, index: i }))}
                  className={`
                    w-8 h-8 text-xs rounded-md transition-all font-medium
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }
                  `}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          {selectedTimeIndices.length > 1 && (
            <p className="text-xs text-blue-600 mt-1.5 font-medium">
              ✓ {selectedTimeIndices.length} states selected — showing side-by-side comparison
            </p>
          )}
        </div>
      )}
      
      {/* Original minimap (always visible for navigation) */}
      <Minimap
        collapsed={isCollapsed}
        current={timeIndex}
        length={traceLength}
        loopBack={loopBack}
        label={(index) => `State ${index + 1}/${traceLength}`}
        onChange={indexSet}
        onToggleCollapse={() => setIsCollapsed((collapsed) => !collapsed)}
      />
    </div>
  );
};

export { TimePicker };
