import { AlloyDatum } from './datum';
import { instanceFromElement } from './instance';

export function parseAlloyXML(xml: string): AlloyDatum {
  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const instances = Array.from(document.querySelectorAll('instance'));
  if (!instances.length) throw new Error(`No Alloy instance in XML: ${xml}`);
  
  // The provider may pass various visualizer-configuration information as part 
  // of the instance XML. (This is not part of the Alloy instance XML spec, but 
  // is useful.) 
  const visualizerElements = document.querySelectorAll('visualizer');
  let maybeCnDText, maybeScriptText, maybeThemeText = undefined
  for(const vis of visualizerElements) {
    // The last visualizer element for a given attribute will apply.
    const maybeScriptTextLocal = parseStringAttribute(vis, 'script')
    const maybeThemeTextLocal = parseStringAttribute(vis, 'theme')
    const maybeCnDTextLocal = parseStringAttribute(vis, 'cnd')
    maybeScriptText = maybeScriptTextLocal ?? maybeScriptText
    maybeCnDText = maybeCnDTextLocal ?? maybeCnDText
    maybeThemeText = maybeThemeTextLocal ?? maybeThemeText
  }

  return {
    instances: instances.map(instanceFromElement),
    bitwidth: parseNumericAttribute(instances[0], 'bitwidth'),
    command: parseStringAttribute(instances[0], 'command'),
    loopBack:
      parseNumericAttribute(instances[0], 'backloop') ??
      // TODO: Remove this hack once forge is fixed
      parseNumericAttribute(instances[0], 'loop'),
    maxSeq: parseNumericAttribute(instances[0], 'maxseq'),
    maxTrace: parseNumericAttribute(instances[0], 'maxtrace'),
    minTrace: parseNumericAttribute(instances[0], 'mintrace'),
    traceLength: parseNumericAttribute(instances[0], 'tracelength'),
    visualizerConfig: {script: deEscape(maybeScriptText), 
                       theme: deEscape(maybeThemeText),
                       cnd: deEscape(maybeCnDText)}
  };
}

function parseNumericAttribute(
  element: Element,
  attribute: string
): number | undefined {
  const value = element.getAttribute(attribute);
  return value ? +value : undefined;
}

function parseStringAttribute(
  element: Element,
  attribute: string
): string | undefined {
  const value = element.getAttribute(attribute);
  return value ? `${value}` : undefined;
}

// Could use decodeURIComponent, but start small
function deEscape(s: string | undefined): string | undefined {
  return s?.replaceAll("&quot;", "\"")
           .replaceAll("\\\"", "\"")
           .replaceAll("&gt;", ">")
           .replaceAll("&lt;", "<")
}

export function sigElementIsSet(sigElement: Element): boolean {
  return sigElement.querySelectorAll('type').length > 0;
}

/**
 * Get the type hierarcies from an <instance> element.
 *
 * @param typeNames Map of type id numbers to type names.
 * @param element An <instance> element.
 */
export function typeHierarchiesFromElement(
  typeNames: Record<string, string>,
  element: Element
): Record<string, string[]> {
  const parents: Record<string, string> = {};

  const sigElements = element.querySelectorAll('sig');
  for (const sigElement of sigElements) {
    if (!sigElementIsSet(sigElement)) {
      const id = sigElement.getAttribute('ID');
      const parentId = sigElement.getAttribute('parentID');
      const label = sigElement.getAttribute('label');
      if (!id) throw new Error('No ID found for sig element');
      if (!label) throw new Error('No label found for sig element');
      if (parentId) parents[id] = parentId;
    }
  }

  const traverseHierarchy = (id: string, hierarchy: string[]): string[] => {
    if (!parents[id]) return hierarchy;
    return traverseHierarchy(parents[id], [...hierarchy, typeNames[id]]);
  };

  const hierarchies: Record<string, string[]> = {};

  for (const id in typeNames) {
    hierarchies[typeNames[id]] = traverseHierarchy(id, []);
  }

  return hierarchies;
}

export function typeNamesFromElement(element: Element): Record<string, string> {
  const names: Record<string, string> = {};
  const sigElements = element.querySelectorAll('sig');
  for (const sigElement of sigElements) {
    const id = sigElement.getAttribute('ID');
    const label = sigElement.getAttribute('label');
    if (!id) throw new Error('No ID found for sig element');
    if (!label) throw new Error('No label found for sig element');
    names[id] = label;
  }
  return names;
}
