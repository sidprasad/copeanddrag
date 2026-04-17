import { Datum, DatumMeta } from './types';

/**
 * A payload containing metadata about the click of an action button. The 
 * (optional) type parameter indicates the structure of any added context 
 * that the provider should be sent.
 */
export interface Click<T = any> {
  /**
   * The id of the datum associated with the button that was clicked. Not all
   * buttons will necessarily be clicked before an active datum is present.
   */
  id: string | undefined;
  /**
   * The string value from the onClick field of the button that was clicked.
   */
  onClick: string;
  /**
   * Optional context that may be carried with this button click. May be 
   * semantic (e.g., requesting a next-instance for a specific generator) 
   * or purely for validation or logging by the provider.
   */
  context?: T;
}

/**
 * A payload containing updates to the data displayed in Sterling.
 */
export interface DataJoin {
  /**
   * An array of new data to display in Sterling.
   */
  enter?: Datum[];
  /**
   * An array of updates to apply to existing data in Sterling.
   */
  update?: DatumMeta[];
  /**
   * An array of (the IDs of) data to be removed from display in Sterling.
   */
  exit?: string[];
}

/**
 * A payload containing an expression to evaluate.
 */
export interface EvalExpression {
  /**
   * The unique id of expression to be evaluated.
   */
  id: string;
  /**
   * The id of the datum associated with the expression to evaluate.
   */
  datumId: string;
  /**
   * The expression to evaluate.
   */
  expression: string;
}

/**
 * A payload containing the result of evaluating an expression.
 */
export interface EvalResult {
  /**
   * The unique id of the expression that was evaluated.
   */
  id: string;
  /**
   * The result of the evaluating the expression.
   */
  result: string;
}

/**
 * A payload containing a data provider's metadata.
 */
export interface ProviderMeta {
  /**
   * The name of the data provider.
   */
  name?: string;
  /**
   * Whether the provider supports a REPL.
   */
  evaluator?: string;
  /**
   * The Sterling views the provider wants available to the user.
   */
  views?: ('graph' | 'table' | 'script' | 'edit')[];
  /**
   * The selection of instance generators that Sterling can request from. In
   * Alloy and Forge, this would be the "menu" of run, check, etc. commands.
   */
  generators?: string[];
  /**
   * Optional feature flags exposed by the provider. Use this to toggle
   * experimental UI affordances.
   */
  features?: string[];
}
