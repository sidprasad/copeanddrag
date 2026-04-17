import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { SterlingDispatch, SterlingState } from './store';

export const useSterlingDispatch = () => useDispatch<SterlingDispatch>();
export const useSterlingSelector: TypedUseSelectorHook<SterlingState> =
  useSelector;
