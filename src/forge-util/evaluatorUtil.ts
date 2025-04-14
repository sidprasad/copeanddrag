import { DOMParser } from '@xmldom/xmldom';

import { ForgeExprEvaluatorUtil } from 'forge-expr-evaluator';
import { AlloyDatum, AlloyRelation, parseAlloyXML, AlloyTuple, AlloyInstance, AlloyType } from '../alloy-instance';
import { DatumParsed, ParsedValue, Relation, Sig, InstanceData, ForgeTuple, BuiltinType } from 'forge-expr-evaluator/dist/types';




function toForgeType(type: AlloyType): Sig | BuiltinType {


    let meta = type.meta && type.meta.builtin ? {
        builtin: type.meta.builtin
    } : undefined

    return {
        _: type._,
        id: type.id,
        types: type.types,
        atoms: type.atoms,
        meta: meta
    };

}

function toForgeTuple(tuple: AlloyTuple): ForgeTuple {
    return {
        _: tuple._,
        types: tuple.types,
        atoms: tuple.atoms
    };
}

function toRelation(r: AlloyRelation): Relation {

    return {
        _: r._,
        id: r.id,
        name: r.name,
        types: r.types,
        tuples: r.tuples.map((tuple) => toForgeTuple(tuple))
    };

}

function toInstanceData(id: AlloyInstance): InstanceData {

    let alloyRelations = id.relations;
    let alloySkolems = id.skolems;
    let alloyTypes = id.types;

    let forgeRelations: Record<string, Relation> = {};
    for (let key in alloyRelations) {
        forgeRelations[key] = toRelation(alloyRelations[key]);
    }

    let forgeTypes: {
        "seq/Int": BuiltinType;
        Int: BuiltinType;
        univ: BuiltinType;
        [key: string]: Sig;
    } = {
        "seq/Int": toForgeType(alloyTypes["seq/Int"]) as BuiltinType,
        Int: toForgeType(alloyTypes["Int"]) as BuiltinType,
        univ: toForgeType(alloyTypes["univ"]) as BuiltinType,
    };

    // Dynamically add other keys from alloyTypes
    for (let key in alloyTypes) {
        if (key !== "seq/Int" && key !== "Int" && key !== "univ") {
            forgeTypes[key] = toForgeType(alloyTypes[key]);
        }
    }

    // We have to ensure some things here!

    return {
        types: forgeTypes,
        relations: forgeRelations,
        skolems: alloySkolems
    };

}


function toParsedValue(ad: AlloyDatum): ParsedValue {

    // export interface AlloyDatum {
    //   instances: AlloyInstance[];
    //   bitwidth?: number;
    //   command?: string;
    //   loopBack?: number;
    //   maxSeq?: number;
    //   maxTrace?: number;
    //   minTrace?: number;
    //   traceLength?: number;
    //   visualizerConfig?: VisualizerConfig;
    // }

    // export interface ParsedValue {
    //     instances: InstanceData[];
    //     bitwidth: number;
    //     [key: string]: any;
    // }

    // Convert the AlloyDatum to a ParsedValue object
    let parsedValue: ParsedValue = {
        instances: ad.instances.map((instance) => toInstanceData(instance)),
        bitwidth: ad.bitwidth
        // Maybe more?

    };

    return parsedValue;


}

function alloyXMLToDatumParsed(datum: string): DatumParsed {
    let ad: AlloyDatum = parseAlloyXML(datum);
    let parsedValue: ParsedValue = toParsedValue(ad);

    return {
        parsed: parsedValue,
        data: datum
    };
}



export class EvalResult {


    private result: string | string[][];

    constructor(result: string | string[][]) {
        this.result = result;
    }

    public prettyPrint(): string {
        if (typeof this.result === 'string') {
            return this.result;
        } else {
            let tupleStringArray: string[] = [];
            // For each tuple in the result, join the elements with a ->
            for (let i = 0; i < this.result.length; i++) {
                let tuple: string[] = this.result[i];
                let tupleString = tuple.join("->");
                tupleStringArray.push(tupleString);
            }
            // Now join the tuplesStringArray with " , "
            let resultString = tupleStringArray.join(" , ");
            return resultString;
        }
    }

    /*
        Only true if the result is #t
    */
    public appliesTo(): boolean {
        // If the result is a string, it is not selected.
        if (typeof this.result === 'string') {
            return this.result === "#t";
        }
        return false;
    }


    /* 
        Specifically returns the elements IF a set.
    */
    public selected(): string[][] {
        if (typeof this.result === 'string') {
            return [];
        }
        return this.result;
    }


    // Lets write selected of 1
    public selectedAtoms(): string[] {

        if (typeof this.result === 'string') {
            return [];
        }
        let selectedElements = this.result.filter((element) => element.length > 0);
        if (selectedElements.length === 0) {
            return [];
        }

        // Flatten the selected elements
        let flattened = selectedElements.flat();
        // Now dedupe the elements
        let uniqueElements = Array.from(new Set(flattened));
        return uniqueElements;
    }


    /*
        Returns the selected tuples.
        By default returns the first and last elements of the selected elements.
    */
    public selectedTwoples(): string[][] {

        if (typeof this.result === 'string') {
            return [];
        }

        // NO ATOMS
        let selectedElements = this.result.filter((element) => element.length > 1);
        if (selectedElements.length === 0) {
            return [];
        }


        // Now get the FIRST AND LAST elements of the selected elements
        let selectedTuples = selectedElements.map((element) => {
            return [element[0], element[element.length - 1]];
        }
        );
        return selectedTuples;

    }
}

export class WrappedForgeEvaluator {
    public sourceDatum: any;
    private evaluator: ForgeExprEvaluatorUtil;
    private sourceCode: string;

    static getSourceCodeFromDatum(datum: any): string {
        const xmlParser = new DOMParser();
        const xmlDoc = xmlParser.parseFromString(datum, "application/xml");


        // How do I get the <source> element from the XML document?
        const sourceElement = xmlDoc.getElementsByTagName("source")[0];
        if (!sourceElement) {
            throw new Error("No <source> element found in XML");
        }

        // Also, how do I get the content attribute from the <source> element?
        const content = sourceElement.getAttribute("content");
        if (!content) {
            throw new Error("No content attribute found in <source> element");
        }

        return content;
    }




    constructor(datumAsXML: any) {

        // TODO: Better, more graceful failure.

        // We need to create a datum here that is appropriate for the evaluator.
        var ad: AlloyDatum = parseAlloyXML(datumAsXML);

        let datumParsed: DatumParsed = alloyXMLToDatumParsed(datumAsXML);


        // TODO: There may just *be no source code* in the datum.

        this.sourceDatum = datumAsXML;
        this.sourceCode = WrappedForgeEvaluator.getSourceCodeFromDatum(datumAsXML);
        this.evaluator = new ForgeExprEvaluatorUtil(datumParsed, this.sourceCode);
    }



    public getEvaluator(): ForgeExprEvaluatorUtil {
        return this.evaluator;
    }


    public evaluate(expr: string, instanceIndex?: number): EvalResult {

        if (!this.sourceCode) {
            // This is a problem.
            // What if there is no source code?
        }


        let result = this.evaluator.evaluateExpression(expr, instanceIndex);
        return new EvalResult(result);
    }

}


