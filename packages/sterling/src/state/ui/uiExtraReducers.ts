import { ProviderMeta } from '@/sterling-connection';
import { PayloadAction } from '@reduxjs/toolkit';
import { UiState } from './ui';

function metaReceived(state: UiState, action: PayloadAction<ProviderMeta>) {
  const meta = action.payload;
  if (meta.views) {
    state.availableViews = meta.views.map((view) => {
      switch (view) {
        case 'graph':
          return 'GraphView';
        case 'table':
          return 'TableView';
        case 'script':
          return 'ScriptView';
        case 'edit':
          return 'EditView';
      }
    });
    // Always include EditView if not already present
    if (!state.availableViews.includes('EditView')) {
      state.availableViews.push('EditView');
    }
    state.mainView = state.availableViews[0];

    // If the provider listed its generators, default to whatever it listed first.
    // This will match the initial loading behavior of the Select drop-down component
    // in the explorer pane. 
    if(meta.generators && meta.generators.length > 0) {
      state.selectedGenerator = meta.generators[0]
    }
  }
}

export default { metaReceived };
