import { DOMParser } from '@xmldom/xmldom';

import { ForgeExprEvaluatorUtil, EvaluationResult, ErrorResult } from 'forge-expr-evaluator';
import { AlloyDatum, AlloyRelation, parseAlloyXML, AlloyTuple, AlloyInstance, AlloyType } from 'cnd-core';
import { DatumParsed, ParsedValue, Relation, Sig, InstanceData, ForgeTuple, BuiltinType } from 'forge-expr-evaluator/dist/types';
import {EvalResult, SingleValue, Tuple} from 'forge-expr-evaluator/dist/ForgeExprEvaluator';



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

function isErrorResult(result: EvaluationResult): result is ErrorResult {
    return (result as ErrorResult).error !== undefined;
}

// export type SingleValue = string | number | boolean;
// export type Tuple = SingleValue[];
// export type EvalResult = SingleValue | Tuple[];
function isSingleValue(value: unknown): value is SingleValue {
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}


function singleValueToString(value: SingleValue): string {
    if (typeof value === "string") {
        return value;
    } else if (typeof value === "number") {
        return value.toString();
    } else if (typeof value === "boolean") {
        return value ? "true" : "false";
    }
    throw new Error("Invalid SingleValue type");
}

export class WrappedEvalResult {

    private result: EvaluationResult;
    private isError: boolean = false;
    private isSingleton: boolean = false;
    private expr: string;

    constructor(result: EvaluationResult, expr: string) {
        this.result = result;
        this.expr = expr;
        this.isError = isErrorResult(result);
        this.isSingleton = isSingleValue(result);
    }





    public prettyPrint(): string {


        if (typeof this.result === 'string') {
            return this.result;
        } 
        else if (typeof this.result === 'number') {
            return this.result.toString();
        }
        else if (typeof this.result === 'boolean') {
            return this.result ? "true" : "false";
        }
        else if (this.isError) {
            let errorResult = this.result as ErrorResult;
            return `Error: ${errorResult.error.message}`;
        }
        else {
            let tupleStringArray: string[] = [];
            let asTuple = this.result as Tuple[];


            // For each tuple in the result, join the elements with a ->
            for (let i = 0; i < asTuple.length; i++) {
                let tuple: string[] = this.result[i];
                let tupleString = tuple.join("->");
                tupleStringArray.push(tupleString);
            }
            // Now join the tuplesStringArray with " , "
            let resultString = tupleStringArray.join(" , ");
            return resultString;
        }
    }


    public singleResult(): SingleValue {
        if (!this.isSingleton) {
            let pp = this.prettyPrint();
            throw new Error(`Expected selector ${this.expr} to evaluate to a single value. Instead:${pp}`);
        }
        return this.result as SingleValue;
    }

    // Lets write selected of 1
    public selectedAtoms(): string[] {

        if (this.isSingleton || this.isError) {
            let pp = this.prettyPrint();
            throw new Error(`Expected selector ${this.expr} to evaluate to values of arity 1. Instead: ${pp}`);   
        }

        let asTuple = this.result as Tuple[];


        let selectedElements = asTuple.filter((element) => element.length > 0);
        if (selectedElements.length === 0) {
            return [];
        }

        // Now ensure that all selected elements are of arity 1
        selectedElements = selectedElements.filter((element) => element.length === 1);
        /// ... ///

        // Flatten the selected elements
        let flattened = selectedElements.flat().map((element) => singleValueToString(element));;


        // Now dedupe the elements
        let uniqueElements = Array.from(new Set(flattened));
        return uniqueElements;
    }


    /*
        Returns the selected tuples.
        By default returns the first and last elements of the selected elements.
    */
    public selectedTwoples(): string[][] {

        if (this.isSingleton || this.isError) {
            let pp = this.prettyPrint();
            throw new Error(`Expected selector ${this.expr} to evaluate to values of arity 2. Instead:${pp}`);   
        }

        // NO ATOMS
        let asTuple = this.result as Tuple[];

        let selectedElements = asTuple.filter((element) => element.length > 1);
        if (selectedElements.length === 0) {
            return [];
        }


        // Now get the FIRST AND LAST elements of the selected elements
        let selectedTuples = selectedElements.map((element) => {
            return [element[0], element[element.length - 1]];
        }).map((element) => {
            return element.map((e) => singleValueToString(e));
        });
        return selectedTuples;

    }

    /*
        Returns the selected tuples, with all elements.
    */
    public selectedTuplesAll(): string[][] {

        if (this.isSingleton || this.isError) {
            let pp = this.prettyPrint();
            throw new Error(`Expected selector ${this.expr} to evaluate to values of arity 2. Instead:${pp}`);   
        }

        // NO ATOMS
        let asTuple = this.result as Tuple[];

        let selectedElements = asTuple.filter((element) => element.length > 1);
        if (selectedElements.length === 0) {
            return [];
        }

        let selectedTuples = selectedElements.map((element) => {
            return element.map((e) => singleValueToString(e));
        });
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
            console.error("No <source> element found in XML");
            return "";
        }

        // Also, how do I get the content attribute from the <source> element?
        const content = sourceElement.getAttribute("content") || "";
        if (!content) {
            console.error("No content attribute found in <source> element");
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


    public evaluate(expr: string, instanceIndex?: number): WrappedEvalResult {

        if (!this.sourceCode) {
            // This is a problem.
            // What if there is no source code?
        }

        try {
            let result : EvaluationResult = this.evaluator.evaluateExpression(expr, instanceIndex);

            if (isErrorResult(result)) {
                throw new Error(result.error.message);
            }


            return new WrappedEvalResult(result, expr);
        }
        catch (e) {
            // HACKY
            let innerMessage = e.message;
            let err = new Error("Error evaluating Forge expression: <pre>" + expr + "</pre> <br>" + e);
            (err as any).evaluatorError = innerMessage;
            throw err;
        }
    }

}


