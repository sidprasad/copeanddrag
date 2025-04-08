import { DOMParser } from '@xmldom/xmldom';

export function getSourceCodeFromDatum(datum: any): string {
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

    // if (xmlDoc.documentElement.nodeName === "parsererror") {
    //   throw new Error(`XML parsing error: ${xmlDoc.documentElement.textContent}`);
    // }
  
    // const sourceElement = xmlDoc.querySelector("source");
    // if (sourceElement === null) {
    //   throw new Error("No source element found in XML");
    // }
    // const content = sourceElement.getAttribute("content");
    // if (content === null) {
    //   throw new Error("No content attribute found in source element");
    // }
    // return content;
}