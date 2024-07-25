
/*

    Example

    {
    // Field for layout
        'fieldDirections': {
            'left': ['above, left'],
            'right': ['above, right]'
        },

        // Fields that define clusters (aka field values that are used to group atoms)
        'groupBy': [],
        'sigIcons': [], // TODO: Implement this
    }



*/

interface LayoutSpec {
    fieldDirections : DirectionalRelation[];
    groupBy : ClusterRelation[];
}

interface DirectionalRelation {
    fieldName : string;
    directions : string[];
}

interface ClusterRelation {
    fieldName : string;
}


export class LayoutInstance {
    /* TODO: Implement this class */

    private readonly _annotSpec : string;
    private readonly _layoutSpec: LayoutSpec;

    LEFT_CONSTRAINT : string = "_layoutLeft";
    RIGHT_CONSTRAINT : string = "_layoutRight";
    TOP_CONSTRAINT : string = "_layoutAbove";
    BOTTON_CONSTRAINT : string = "_layoutBelow";


    constructor(annotationSpec : string) {
        this._annotSpec = annotationSpec;
        
        try {
            this._layoutSpec = JSON.parse(this._annotSpec) as LayoutSpec;
            // Now _layoutSpec is populated with the parsed data and can be used
        } catch (error) {
            console.error("Failed to parse annotation spec. Defaulting to no layout.", error);
            this._layoutSpec = {
                fieldDirections: [],
                groupBy: []
            };
        }
    }


    getFieldLayout(fieldId: string): string[] {
        
        const fieldDirection = this._layoutSpec.fieldDirections.find((field) => field.fieldName === fieldId);
        if (fieldDirection) {
            return fieldDirection.directions.map((dir) => {
                if (dir == "above") {
                    return this.TOP_CONSTRAINT;
                } else if (dir === "below") {
                    return this.BOTTON_CONSTRAINT;
                } else if (dir === "left") {
                    return this.LEFT_CONSTRAINT;
                } else if (dir === "right") {
                    return this.RIGHT_CONSTRAINT;
                }
            });
        }

        return [];
    }

    shouldClusterOnField(fieldId: string): boolean {
        const isMember = this._layoutSpec.groupBy.some((cluster) => cluster.fieldName === fieldId);
        return isMember;
        // check if fieldId is a member of groupBy

    }

    /// This is trickier, will do "property"
    getAtomLayout(atomId: string): string[] {
        return [];
    }
}