/**
 * A button that can be displayed in the Sterling user interface.
 */
export interface Button {
  /**
   * The text to display in the button.
   */
  text: string;
  /**
   * A string that will be sent to the provider when the button is clicked.
   */
  onClick: string;
  /**
   * A string that will be displayed as a tooltip with the button is hovered.
   */
  mouseover?: string;
}

/**
 * An individual datum that can be displayed in Sterling.
 */
export interface Datum {
  /**
   * The provider's name for the generator that produced this datum. In Alloy or 
   * Forge, this would be a run name, check name, etc. If undefined, the provider
   * has not distinguished between different generators. 
   */
  generatorName: string | undefined;
  /**
   * A unique identifier
   */
  id: string;
  /**
   * The format of the data.
   */
  format: string;
  /**
   * The raw data.
   */
  data: string;
  /**
   * An array of buttons to be displayed with this datum in the Sterling interface.
   */
  buttons?: Button[];
  /**
   * A boolean indicating whether REPL functionality is available for this datum.
   */
  evaluator?: boolean;
}

/**
 * An indivdual datum that has been parsed and can be displayed in Sterling
 */
export interface DatumParsed<T> extends Datum {
  /**
   * The parsed datum
   */
  parsed: T;
}

/**
 * The metadata associated with a Datum.
 */
export type DatumMeta = Omit<Datum, 'data' | 'format'>;
