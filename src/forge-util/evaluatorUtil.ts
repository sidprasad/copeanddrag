import { DOMParser } from '@xmldom/xmldom';

import {ForgeExprEvaluatorUtil} from 'forge-expr-evaluator';
import { AlloyDatum, AlloyRelation, parseAlloyXML, AlloyTuple , AlloyInstance, AlloyType} from '../alloy-instance';
import {DatumParsed, ParsedValue, Relation, Sig, InstanceData, ForgeTuple, BuiltinType} from 'forge-expr-evaluator/dist/types';

import { TypeMeta } from '../alloy-instance/src/type';

function toForgeType(type: AlloyType) : Sig | BuiltinType {


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

function toForgeTuple(tuple: AlloyTuple) : ForgeTuple {
    return {
        _: tuple._,
        types: tuple.types,
        atoms: tuple.atoms
    };
}

function toRelation(r : AlloyRelation) : Relation {

    return {
        _: r._,
        id: r.id,
        name: r.name,
        types: r.types,
        tuples: r.tuples.map((tuple) => toForgeTuple(tuple))
    };

 }

function toInstanceData(id: AlloyInstance) : InstanceData {

   // TODO

   /*
   export interface AlloyInstance {
     types: Record<string, AlloyType>;
     relations: Record<string, AlloyRelation>;
     skolems: Record<string, AlloyRelation>;
   }
     */


   /*

export interface InstanceData {
    types: {
        "seq/Int": BuiltinType;
        Int: BuiltinType;
        univ: BuiltinType;
        [key: string]: Sig;
    };
    relations: {
        [key: string]: Relation;
    };
    skolems: any;
}
   */

    let alloyRelations = id.relations;
    let alloySkolems = id.skolems;
    let alloyTypes = id.types;

    let forgeRelations : Record<string, Relation> = {};
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


function toParsedValue(ad : AlloyDatum) : ParsedValue {

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
    // Convert the AlloyDatum to a DatumParsed object

    let ad: AlloyDatum = parseAlloyXML(datum);
    // Now need to convert ad to ParsedValue

    let parsedValue: ParsedValue = {
        instances: ad.instances.map((instance) => toInstanceData(instance)),
        bitwidth: ad.bitwidth
    };


    return {
        parsed: parsedValue,
        data: datum
    };
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
        if(!sourceElement) {
            throw new Error("No <source> element found in XML");
        }
    
        // Also, how do I get the content attribute from the <source> element?
        const content = sourceElement.getAttribute("content");
        if(!content) {
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


    public evaluate(expr: string, instanceIndex? : number): any {

        let result = this.evaluator.evaluateExpression(expr, instanceIndex);

        // We may need to do some post-processing on the result.


        return result;

    }

}


