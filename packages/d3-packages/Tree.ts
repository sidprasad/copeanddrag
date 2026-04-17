import { Circle } from './Circle';
import {VisualObject} from './VisualObject'
import {Coords, toFunc} from "./Utility"
import {TextBox} from './Textbox'
import {Line} from "./Line"
import { Children } from 'react';
import { DEFAULT_LINE_COLOR, DEFAULT_STROKE_WIDTH, DEFAULT_TREE_LINE_COLOR, DEFAULT_TREE_LINE_WIDTH } from './Constants';

/**
 * Interface for node in a tree with a visualObject
 */
export interface VisTree{
    visualObject: VisualObject,
    children: VisTree[]
}

export interface TreeProps {
    root: VisTree, 
    height: number, 
    width: number, 
    coords?: Coords | (() => Coords), 
    edgeColor?: string, 
    edgeWidth?: number
}

export class Tree extends VisualObject{
    root: VisTree;
    height: number;
    width: number
    private lines: Line[];
    private subTrees: Tree[]
    private coords: () => Coords
    
    /**
     * Builds a tree object, pulling all children nodes into proper locations and
     * adding lines where necessary.
     * @param root root of the tree of visual objects
     * @param height height of box to bound the tree
     * @param width width of box to bound the tree
     * @param coords top left point of the tree
     */
    constructor(props: TreeProps){
        super(props.coords)
        let coordsFunc = toFunc({x:0, y:0}, props.coords)
        this.center = () => {
            return {
                x: coordsFunc().x + this.width / 2,
                y: coordsFunc().y + this.height / 2
            }
        }
        // Coords is essentially a helper function because it's easier to deal with. It needs
        // to be defined in terms of the center for use within the system, however, as that's
        // What's going to be edited to move the grid. 
        this.coords = () => {
            const ctr = this.center()
            return {                
                x: ctr.x - this.width / 2,
                y: ctr.y - this.height / 2
            }
        }

        this.height = props.height;
        this.width = props.width;
        this.root = props.root;
        
        let oldCenterFunc: () => Coords = this.root.visualObject.center
        this.root.visualObject.setCenter(() => { 
            const cs = this.coords() 
            const octr = oldCenterFunc()
            return {
                x: cs.x + this.width / 2 + octr.x,
                y: cs.y + octr.y
        }})

        this.lines = []
        this.subTrees = []

        this.setUpSubtrees();
        this.setLineColor(props.edgeColor ?? DEFAULT_TREE_LINE_COLOR);
        this.setLineWidth(props.edgeWidth ?? DEFAULT_TREE_LINE_WIDTH)
    }

    private setUpSubtrees(){ // There's a lot of math happening here, 
        // Need to more reliably comment details of it
        let layerHeight: number = this.height/(treeHeight(this.root) - 1)
        // console.log(layerHeight)

        let totalWidth: number = this.root.children
            .map((childTree): number => treeWidth(childTree))
            .reduce((partialSum, childWidth): number => partialSum + childWidth, 0)
        
        this.subTrees = []
        let currTotalWidth = 0
        this.subTrees = this.root.children.map((childTree): Tree => {

            let childWidth: number = treeWidth(childTree)
            let prevWidth: number = currTotalWidth
            currTotalWidth += childWidth

            //console.log(`subtree: ${this.coords().x + (prevWidth / totalWidth) * this.width} ${this.coords().y + layerHeight}`)
            return new Tree({
                root: childTree, 
                height: layerHeight * (treeHeight(childTree) - 1),
                width: this.width * treeWidth(childTree) / totalWidth,
                coords: () => { 
                    const thiscs = this.coords()
                    return {
                        x: thiscs.x + (prevWidth / totalWidth) * this.width,
                        y: thiscs.y + layerHeight
                }} // Might need to set line color? Needs testing. 
            })
        })

        this.subTrees.forEach((subTree) => {
            this.lines.push(new Line({
                points: [() => { 
                    const vocs = this.root.visualObject.center()
                    return {
                        x: vocs.x,
                        y: vocs.y
                }},
                () => { 
                    const subvocs = subTree.root.visualObject.center()
                    return {
                        x: subvocs.x,
                        y: subvocs.y
                }}],
                color: DEFAULT_LINE_COLOR,
                width: DEFAULT_STROKE_WIDTH // Need to make default later
            }))
        })
        this.lines.forEach((line) => { this.children.push(line) })
        this.subTrees.forEach((subTree) => { this.children.push(subTree) })
        this.children.push(this.root.visualObject)
    }

    setLineColor(color: string){
        this.lines.forEach((line) => line.setColor(color))
        this.subTrees.forEach(subTree => subTree.setLineColor(color))
    }
    setLineWidth(width: number){
        this.lines.forEach((line) => line.setWidth(width))
        this.subTrees.forEach(subTree => subTree.setLineWidth(width))
    }
}

/**
 * Utility func finding length of a tree
 * @param visTree 
 * @returns the height of the tree (depth)
 */
function treeHeight(visTree: VisTree): number{
    let height: number = 0;
    let toCheck: VisTree[] = [visTree]

    while (toCheck.length != 0){
        height += 1
        let newToCheck: VisTree[] = []

        toCheck.forEach((visTree) => {
            visTree.children.forEach((child) => {
                newToCheck.push(child)
            })
        })

        toCheck = newToCheck;
    }
    return height
}

/**
 * Utility function finding width of a tree
 * @param visTree 
 * @returns the width of the tree (depth)
 */
 function treeWidth(visTree: VisTree): number{
    let width = 1;
    let toCheck: VisTree[] = [visTree]

    while (toCheck.length != 0){
        let newToCheck: VisTree[] = []

        toCheck.forEach((visTree) => {
            visTree.children.forEach((child) => {
                newToCheck.push(child)
            })
        })

        toCheck = newToCheck;
        width = Math.max(width, newToCheck.length);
    }
    return width
}
