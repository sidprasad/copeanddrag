import { useState } from 'react';
import type { LayoutSpecWarning } from '../../utils/spytialCore';

interface LayoutWarningBannerProps {
  warnings: LayoutSpecWarning[];
  onDismiss: () => void;
}

/**
 * Non-blocking amber banner for a layout spec's advisory warnings
 * (spytial-core >= 3.3.0 `parseLayoutSpec().warnings`: deprecated keys,
 * unknown-key typos, …).
 *
 * Deliberately distinct from the blocking red error modal that sits alongside
 * it in GraphView: warnings never prevent a render, so this informs without
 * interrupting. Styling mirrors EditView's "Copied with N warning(s)" feedback
 * so the two warning surfaces read the same. Renders nothing when there are no
 * warnings.
 */
export function LayoutWarningBanner({ warnings, onDismiss }: LayoutWarningBannerProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (warnings.length === 0) return null;

  return (
    <div
      className="flex-shrink-0 px-3 py-2 border-b text-xs bg-warning-bg border-warning-border text-warning"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">
          Layout spec has {warnings.length} warning{warnings.length === 1 ? '' : 's'}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="underline hover:no-underline"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="hover:opacity-70"
            aria-label="Dismiss layout warnings"
          >
            ✕
          </button>
        </div>
      </div>
      {showDetails && (
        <ul className="mt-1.5 space-y-0.5 list-disc list-inside">
          {warnings.map((w, idx) => (
            <li key={idx}>
              {w.code && (
                <code className="mr-1 opacity-70 font-mono">[{w.code}]</code>
              )}
              <span>{w.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
