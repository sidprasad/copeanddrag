

export class LayoutInstance {
    /* TODO: Implement this class */

    private readonly _annotSpec : string;


    LEFT_CONSTRAINT : string = "_layoutLeft";
    RIGHT_CONSTRAINT : string = "_layoutRight";
    TOP_CONSTRAINT : string = "_layoutAbove";
    BOTTON_CONSTRAINT : string = "_layoutBelow";


    constructor(annotationSpec : string) {
        this._annotSpec = annotationSpec;
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