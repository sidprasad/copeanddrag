import { memo } from 'react';

/**
 * Generic props are lost when a component is passed through React.memo
 * so this is a simple identity function that ensures the correct types
 * are passed through.
 * See: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
 */
export const typedMemo: <T>(c: T) => T = memo;