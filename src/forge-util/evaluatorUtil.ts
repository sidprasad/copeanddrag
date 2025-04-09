import { DOMParser } from '@xmldom/xmldom';

import {ForgeExprEvaluatorUtil} from 'forge-expr-evaluator';


// {erhaps this should be a class.


class WrappedForgeEvaluator {
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
        this.sourceCode = WrappedForgeEvaluator.getSourceCodeFromDatum(datumAsXML);
        this.evaluator = new ForgeExprEvaluatorUtil(datumAsXML, this.sourceCode);
    }



    public getEvaluator(): ForgeExprEvaluatorUtil {
        return this.evaluator;
    }


    public evaluate(expr: string): any {
    }

}


