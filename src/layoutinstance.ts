

export class LayoutInstance {
    /* TODO: Implement this class */

    _tempRecord : Record<string, string[]>;


    LEFT_CONSTRAINT : string = "_layoutLeft";
    RIGHT_CONSTRAINT : string = "_layoutRight";
    TOP_CONSTRAINT : string = "_layoutAbove";
    BOTTON_CONSTRAINT : string = "_layoutBelow";


    constructor() {

    }


    getFieldLayout(fieldId: string): string[] {
        

        if (fieldId == "left") {
            return [this.LEFT_CONSTRAINT, this.TOP_CONSTRAINT];
        }
        return [];
    }

    getSigLayout(sigId: string): string[] {
        return [];
    }

    /// This is trickier, will do "property"
    getAtomLayout(atomId: string): string[] {
        return [];
    }
}