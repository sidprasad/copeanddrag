import { DOMParser } from '@xmldom/xmldom';

import {ForgeExprEvaluatorUtil} from 'forge-expr-evaluator';



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


        // There may just *be no source code* in the datum.

        this.sourceDatum = datumAsXML;
        this.sourceCode = WrappedForgeEvaluator.getSourceCodeFromDatum(datumAsXML);
        this.evaluator = new ForgeExprEvaluatorUtil(datumAsXML, this.sourceCode);
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


