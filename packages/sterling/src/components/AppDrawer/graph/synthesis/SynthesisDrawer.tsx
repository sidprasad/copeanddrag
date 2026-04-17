import { PaneTitle } from '@/sterling-ui';
import { Icon } from '@chakra-ui/react';
import { MdScience } from 'react-icons/md';
import { useSterlingDispatch, useSterlingSelector } from '../../../../state/hooks';
import { selectActiveDatum, selectIsSynthesisActive } from '../../../../state/selectors';
import { enterSynthesisMode } from '../../../../state/synthesis/synthesisSlice';
import SynthesisModePanel from './SynthesisModePanel';

/**
 * The Synthesis Drawer - a dedicated drawer for selector synthesis.
 * This is only visible when synthesis mode is enabled via --env synthesis=true.
 */
const SynthesisDrawer = () => {
  const dispatch = useSterlingDispatch();
  const datum = useSterlingSelector(selectActiveDatum);
  const isSynthesisActive = useSterlingSelector(selectIsSynthesisActive);

  // If synthesis mode is active, show the synthesis panel
  if (isSynthesisActive) {
    return <SynthesisModePanel />;
  }

  // If no datum, show a message
  if (!datum) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 p-8 text-center">
        <Icon as={MdScience} boxSize={12} className="mb-4 text-slate-300" />
        <p className="text-slate-500">Load an instance to start synthesizing selectors.</p>
      </div>
    );
  }

  // Default view - start synthesis button
  return (
    <div className="absolute inset-0 flex flex-col overflow-y-auto bg-slate-50/90 text-slate-900">
      <div className="flex-1 space-y-4 p-4">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white/80 p-6 backdrop-blur shadow-sm">
          <div className="flex items-center gap-3">
            <Icon as={MdScience} boxSize={8} className="text-fuchsia-600" />
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Selector Synthesis</h2>
              <p className="text-sm text-slate-500">
                Synthesize selectors from examples
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Use this tool to automatically generate CnD selectors by providing positive 
            and negative examples. Select atoms across multiple instances to define 
            which elements should be matched by the selector.
          </p>

          <div className="space-y-3 pt-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-medium text-slate-700 mb-2">Selector Types</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-5 h-5 rounded-full bg-fuchsia-100 text-fuchsia-600 text-xs flex items-center justify-center font-semibold mt-0.5">1</span>
                  <span><strong>Unary:</strong> Select individual atoms (e.g., "all Nodes with value &gt; 5")</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-5 h-5 rounded-full bg-purple-100 text-purple-600 text-xs flex items-center justify-center font-semibold mt-0.5">2</span>
                  <span><strong>Binary:</strong> Select pairs of atoms/edges (e.g., "all edges where source.value &lt; target.value")</span>
                </li>
              </ul>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => dispatch(enterSynthesisMode({ numInstances: 3, selectorType: 'unary' }))}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-fuchsia-500 hover:to-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Icon as={MdScience} />
                Synthesize Unary Selector
              </button>
              <button
                type="button"
                onClick={() => dispatch(enterSynthesisMode({ numInstances: 3, selectorType: 'binary' }))}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-purple-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Icon as={MdScience} />
                Synthesize Binary Selector
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SynthesisDrawerHeader = () => {
  return (
    <div className='w-full flex items-center px-2 space-x-2'>
      <PaneTitle>Synthesis</PaneTitle>
    </div>
  );
};

export { SynthesisDrawer, SynthesisDrawerHeader };
