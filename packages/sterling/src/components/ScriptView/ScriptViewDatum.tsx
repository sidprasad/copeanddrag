import { DatumParsed } from '@/sterling-connection';
import { useDimensions } from '@/sterling-hooks';
import { Pane, PaneBody, PaneHeader } from '@/sterling-ui';
import { useToast } from '@chakra-ui/react';
import { editor } from 'monaco-editor';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useSterlingDispatch, useSterlingSelector } from '../../state/hooks';
import { ScriptStageElement } from '../../state/script/script';
import {
  scriptStageDimensionsSet,
  scriptTextByDatumSet,
  scriptTextSet  
} from '../../state/script/scriptSlice';
import {
  selectScriptStage,
  selectScriptStageDimensions,
  selectScriptText,
  selectScriptVariables
} from '../../state/selectors';
import { extractRequires } from './extractRequires';
import { fetchLibrary } from './fetchLibrary';
import { ScriptEditor } from './ScriptEditor';
import { ScriptViewHeader } from './ScriptViewHeader';
import { scriptViewImports} from './../../../../d3-packages/ScriptViewImports'
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

interface ScriptViewDatumProps {
  datum: DatumParsed<any>;
}

const ScriptViewDatum = (props: ScriptViewDatumProps) => {
  const { datum } = props;
  
  const dispatch = useSterlingDispatch();
  const toast = useToast();

  const stage = useSterlingSelector(selectScriptStage);
  const size = useSterlingSelector(selectScriptStageDimensions);
  const initialText = useSterlingSelector(selectScriptText);

  const datumVariables = useSterlingSelector((state) =>
    selectScriptVariables(state, datum)
  );

  const [editor, setEditor] = useState<IStandaloneCodeEditor>();
  const [stageRef, setStageRef] = useState<ScriptStageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useDimensions(containerRef, (rect) => {
    dispatch(
      scriptStageDimensionsSet({
        width: rect.width,
        height: rect.height
      })
    );
  });

  // TN: todo more sanitization
  function sanitizeLibNames(ln: string): string {
    return ln.replaceAll('-', '_')
  }

  const editorRef = useCallback((editor: IStandaloneCodeEditor) => {
    setEditor(editor);
  }, []);
  const svgRef = useCallback((node: SVGSVGElement) => {
    if (node) setStageRef(node);
  }, []);
  const canvasRef = useCallback((node: HTMLCanvasElement) => {
    if (node) setStageRef(node);
  }, []);
  const divRef = useCallback((node: HTMLDivElement) => {
    if (node) setStageRef(node);
  }, []);


  // Only "reactive values" can be used as dependencies here, but `datum` 
  // is reactive since it is a prop. (See docs for `useCallback`.)
  const beforeUnmount = useCallback((text: string) => {
    dispatch(scriptTextSet(text));
    dispatch(scriptTextByDatumSet({id: datum.id, text: text}))
  }, [datum]);

  const onExecute = useCallback(() => {
    const text = editor?.getValue();
    if (text && stageRef && size) {
      // save the script text before executing
      dispatch(scriptTextSet(text));
      dispatch(scriptTextByDatumSet({id: datum.id, text: text}))

      // extract any required libraries from the script
      const [libNames, script] = extractRequires(text);

      // fetch all libraries and execute the script
      Promise.all(libNames.map(fetchLibrary)).then((libraries) => {
        try {
          const executable = new Function(
            stage,
            'width',
            'height',
            ...scriptViewImports.map((v) => v.name),
            ...datumVariables.map((v) => v.name),
            ...libNames.map((ln) => sanitizeLibNames(ln)),
            script
          );
          executable(
            stageRef,
            size.width,
            size.height,
            ...scriptViewImports.map((v) => v.value),
            ...datumVariables.map((v) => v.variable),
            ...libraries
          );
        } catch (e) {                                  
            toast({
              variant: 'top-accent',
              position: 'bottom-right',
              title: e instanceof Error ? e.name : 'Error',
              description: buildErrorDescription(e),
              status: 'error',
              duration: 10000,
              isClosable: true
            })            
        }
      });
    }
  }, [editor, stage, stageRef, size, datumVariables]);

  return (
    <Pane>
      <PaneHeader className='border-b'>
        <ScriptViewHeader datum={datum} onExecute={onExecute} />
      </PaneHeader>
      <PaneBody>
        <div className='grid grid-cols-2 divide-x h-full'>
          <Pane ref={containerRef} className='relative'>
            {stage === 'div' && <div ref={divRef} className='w-full h-full' />}
            {stage === 'canvas' && (
              <canvas ref={canvasRef} className='w-full h-full' />
            )}
            {/* Placing the SVG element within a scrolling div will enable scrolling, 
                provided that the SVG height/width styling is changed directly by the script. 
                The slightly off-white background color shows the actual full SVG area.*/}
            {stage === 'svg' && 
              <div aria-label='SVG Visualization' id='svg-container' style={{height: '100%', width: '100%', overflow: 'scroll'}}>
                <svg ref={svgRef} style={{width:'100%', height:'100%', backgroundColor: 'snow'}}/>
              </div>}
          </Pane>
          <Pane className='relative' aria-label='Visualization Script' data-testid='script-editor-pane'>
            <ScriptEditor
              initialText={initialText}
              variables={datumVariables}
              editorRef={editorRef}
              stageRef={stageRef}
              beforeUnmount={beforeUnmount}
              onExecute={onExecute}
            />
          </Pane>
        </div>
      </PaneBody>
    </Pane>
  );
};

/**
 * Line numbers are being reported slightly off by the browser
 */
const LINE_OFFSET = 2

function buildErrorDescription(e: any): string {
  // If it's not an Error class, use the value itself, converted to a string
  if(!(e instanceof Error)) return `${e}`

  console.log(`Error stack: ${e.stack}`)
  
  //if('fileName' in e) console.log(`Error fileName: ${e.fileName}`)
  //if('lineNumber' in e) console.log(`Error lineNumber: ${e.lineNumber}`)

  // The exception's lineNumber field, if present, may not be reporting the accurate *file*
  // If this happens, confusion may ensue since Sterling will report the wrong line number.
  // Also see:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error


  // Is there a lineNumber field?
  // if('lineNumber' in e && typeof(e.lineNumber) === 'number') {
  //   return `${e.message} near line ${e.lineNumber - LINE_OFFSET} (obtained via lineNumber field)`
  // }  

  // Try to extract the error's line number from the stack. Here, at least, we can be confident there 
  // isn't a mixup between the file and the line. We're looking for the line in the anonymous function:
  // Firefox (Function:x:y) / Chrome (<anonymous>:x:y) patterns  
  if (e.stack != undefined) {
    // Match, with "g" flag to not get capturing groups, just the exact match
    const stackMatchArray = e.stack.match(new RegExp('.*(Function|<anonymous>):[0-9]+:[0-9]+.*', 'g')) 
    if(stackMatchArray) {      
      const stackLine = stackMatchArray[0]
      //console.log(`stackLine: ${JSON.stringify(stackLine)}`)
      const splitPreamble = stackLine.split(new RegExp('.*Function:|<anonymous>:'))
      //console.log(`splitPreamble[1]: ${JSON.stringify(splitPreamble[1])}`)
      const rowCol = splitPreamble[1].split(':')      
      console.log(`rowCol: ${JSON.stringify(rowCol)}`)
      const row = +rowCol[0] - LINE_OFFSET
      const col = rowCol[1]      
        return `${e.message} Around line ${row} (computed via parsing error stack)`
    }
  } 
  
  // Default to the error message by itself (Safari, as of Jan 2023; some syntax errors also)
  return `${e.message} (error location was not provided by the browser)`
}

/*
  As of February, 2024, example stack strings:

  ** SAFARI **
  Doesn't provide enough information.

  ** CHROME ** 
  Error stack: Error: Stage can only add VisualObjects as children.
    at Stage.add (webpack://sterling-ts/./packages/d3-packages/Stage.ts?:27:13)
    at eval (eval at <anonymous> (webpack://sterling-ts/./packages/sterling/src/components/ScriptView/ScriptViewDatum.tsx?), <anonymous>:39:7)
    at eval (webpack://sterling-ts/./packages/sterling/src/components/ScriptView/ScriptViewDatum.tsx?:103:11)

  ** BRAVE ** 
  Error stack: Error: Stage can only add VisualObjects as children.
    at Stage.add (webpack://sterling-ts/./packages/d3-packages/Stage.ts?:27:13)
    at eval (eval at <anonymous> (webpack://sterling-ts/./packages/sterling/src/components/ScriptView/ScriptViewDatum.tsx?), <anonymous>:39:7)
    at eval (webpack://sterling-ts/./packages/sterling/src/components/ScriptView/ScriptViewDatum.tsx?:103:11)

  ** FIREFOX ** 
   Error stack: add@webpack://sterling-ts/./packages/d3-packages/Stage.ts?:27:13
anonymous@http://localhost:8081/main.bundle.js line 2589 > eval line 102 > Function:39:7
ScriptViewDatum/onExecute</<@webpack://sterling-ts/./packages/sterling/src/components/ScriptView/ScriptViewDatum.tsx?:103:21


*/

export { ScriptViewDatum };

