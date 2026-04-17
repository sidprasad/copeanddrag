import { VisualObject } from './VisualObject';
import { BoundingBox, Coords } from './Utility';
export interface TextBoxProps {
    text?: string | (() => string);
    coords?: Coords | (() => Coords);
    color?: string | (() => string);
    fontSize?: number | (() => number);
}
export declare class TextBox extends VisualObject {
    text: () => string;
    fontSize: () => number;
    color: () => string;
    /**
     * Displays given text.
     * @param text text to display
     * @param coords location for center of text
     * @param color text color
     * @param fontSize size of the text
     */
    constructor(props: TextBoxProps);
    boundingBox(): BoundingBox;
    setText(text: string | (() => string)): void;
    setFontSize(fontSize: number | (() => number)): void;
    setTextColor(color: string | (() => string)): void;
    render(svg: any): void;
}
//# sourceMappingURL=TextBox.d.ts.map