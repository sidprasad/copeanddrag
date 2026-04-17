import { PropsWithChildren, useContext, useEffect } from 'react';
import { InteractionCallbacks } from './interactionCallbacks';
import { InteractionContext, interactionContext } from './interactionContext';
import { useInteractionState } from './useInteractionState';

const useInteraction = () => useContext(interactionContext);

export type InteractionProviderProps = InteractionCallbacks & {
  svg: SVGSVGElement | null;
  beforeUnmount?: (state: InteractionContext) => void;
};

const InteractionProvider = (
  props: PropsWithChildren<InteractionProviderProps>
) => {
  const { children, beforeUnmount, ...rest } = props;
  const state = useInteractionState(rest);

  useEffect(() => {
    return () => {
      if (beforeUnmount) beforeUnmount(state);
    };
  }, [beforeUnmount]);

  return (
    <interactionContext.Provider value={state}>
      {children}
    </interactionContext.Provider>
  );
};

export { InteractionProvider, useInteraction };
