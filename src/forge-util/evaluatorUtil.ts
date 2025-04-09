import { DOMParser } from '@xmldom/xmldom';

import {ForgeExprEvaluatorUtil} from 'forge-expr-evaluator';
import { AlloyDatum, AlloyRelation, parseAlloyXML, AlloyTuple , AlloyInstance} from '../alloy-instance';
import {DatumParsed, ParsedValue, Relation, Sig, InstanceData, ForgeTuple} from 'forge-expr-evaluator/dist/types';



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

    let instanceData : InstanceData[] = ad.instances.map((instance) => {
       
        return {
            types : instance.types,
            relations : instance.relations,
            skolems : instance.skolems,
        }


    });


    let parsedValue = {
        bitwidth: ad.bitwidth,
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

        let pv : ParsedValue = toParsedValue(ad);

        let datumParsed : DatumParsed = {
            parsed : pv,
            data: datumAsXML
        }



        // There may just *be no source code* in the datum.

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


