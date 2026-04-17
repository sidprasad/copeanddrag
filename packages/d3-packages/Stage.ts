import {Tree, VisTree} from './Tree';
import { VisualObject } from './VisualObject';
import { TextBox } from './Textbox';
import { Circle } from './Circle';
import * as d3 from 'd3' 
import { BoundingBox } from './Utility';

export class Stage{
    Children: VisualObject[]
    masks: BoundingBox[]

    constructor(){
        this.Children = []
        this.masks = []
    }
    add(addObject:VisualObject){
        // Runtime check, since the input script isn't necessarily type-checked
        if(!(addObject instanceof VisualObject)) {
            throw new Error('Stage can only add VisualObjects as children.')
        }
        this.Children.push(addObject)
    }
    
    addAll(addObjects:VisualObject[]){
        addObjects.forEach((o) => {
            this.Children.push(o);
        })
    }

    remove(removeObject: VisualObject){
        this.Children = this.Children.filter(c => c !== removeObject)
    }

    addMask(bb:BoundingBox){
        this.masks.push(bb);
    }

    childrenToTreeRecurse(root:VisualObject):VisTree{
        const descriptiveText:string = root.constructor.name;
        const returnNode:VisTree = {
            visualObject:new TextBox({text: descriptiveText}),
            children: [],
        }
        if(root.getChildren().length == 0){
            return returnNode;
        }
        else{ //recursive step
            root.children.forEach((child:VisualObject) => {
                returnNode.children.push(this.childrenToTreeRecurse(child));
            })
        }

        return returnNode;

    }
    
    // render_dep_tree(svg: any, document?:any){
    //     d3.selectAll("svg > *").remove();

    //     const root = this.Children;
    //     const treeRoot:VisTree = this.children_to_tree_recurse(root);
    //     const tree:Tree = new Tree({root: treeRoot, height: 700,width: 700, coords: {x:100,y:100}});
    //     tree.render(svg);
    //     if(document){
    //         const svgContainer = document.getElementById('svg-container')
    //         svgContainer.getElementsByTagName('svg')[0].style.height = '200%'
    //         svgContainer.getElementsByTagName('svg')[0].style.width = '200%'
    //     }
        
    // }
    render(svg:any, document?:any){
        d3.select(svg).selectAll('*').remove()
        this.Children.forEach(pane => pane.render(svg, this.masks))
        if(document){
            const svgContainer = document.getElementById('svg-container')
            svgContainer.getElementsByTagName('svg')[0].style.height = '200%'
            svgContainer.getElementsByTagName('svg')[0].style.width = '200%'
        }
    }
}
