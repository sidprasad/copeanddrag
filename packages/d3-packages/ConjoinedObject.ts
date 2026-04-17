import {Coords, BoundingBox} from './Utility'
import {VisualObject} from "./VisualObject"


/**
 * This class is not currently being used!!
 */

export class ConjoinedObject extends VisualObject{

    children:VisualObject[]
    constructor(Children?:VisualObject[]){
        super({x:0,y:0})
        this.children = []
        if(Children){
            Children.forEach(child => {
                this.add(child)
            });
        }
    }

    addOrdered(obj:VisualObject, index:number){
        /**
         * Given an arbitrary visual object, inserts that object at the given
         * index. If the index is greater than the length of objects +1 an error is thrown
         */
        
        // Runtime check, since the input script isn't necessarily type-checked
        if(!(obj instanceof VisualObject)) {
            throw new Error('ConjoinedObject can only add VisualObjects as children.')
        }        

        if(index > this.children.length){
            throw `Index larger than current number of objects stored plus 1. Add an index between 0 and ${this.children.length}`
        }

        this.children.splice(index, 0, obj);
    }

    add(obj:VisualObject){
        /**
         * Ease of access feature by which the visual object that we want to add is added to the front of the visualization
         */
        this.addOrdered(obj,0)
    }

    override setCenter(coords:Coords){
        /**
         * Align all the objects in the conjoined object to a single center
         */
        this.children.forEach(obj => {
            obj.setCenter(coords)
        })
    }
}