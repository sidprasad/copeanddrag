import { D3_TOTAL_DEFS } from 'd3-packages/d3-defs/total-defs';
import { editor } from 'monaco-editor';
import { useCallback, useEffect, useState } from 'react';
import { default as MonacoEditor, monaco } from 'react-monaco-editor';
import { ScriptVariable } from '../../state/script/script';
import { alloyDefs, generateAlloyVariablesModel } from './alloyModel';
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

interface ScriptEditorProps {
  initialText: string;
  variables: ScriptVariable[];
  editorRef: (editor: IStandaloneCodeEditor) => void;
  stageRef: SVGSVGElement | HTMLCanvasElement | HTMLDivElement | null;
  beforeUnmount: (text: string) => void;
  onExecute: () => void;
}

const ScriptEditor = (props: ScriptEditorProps) => {
  const {
    initialText,
    variables,
    editorRef,
    stageRef,
    beforeUnmount,
    onExecute
  } = props;

  const [editor, setEditor] = useState<IStandaloneCodeEditor>();

  const editorDidMount = useCallback((editor: IStandaloneCodeEditor) => {
    editorRef(editor);
    setEditor(editor);
  }, []);

  useEffect(() => {
    if (editor) {
      editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, () => {
        onExecute();
      });

      const uripath = 'ts:filename/alloy.d.js';
      const uri = monaco.Uri.parse(uripath);
      const exists = monaco.editor.getModel(uri) !== null;
      if (!exists) {
        monaco.languages.typescript.javascriptDefaults.setExtraLibs([
          {
            content: alloyDefs,
            filePath: 'alloy.js'
          }
        ]);
        monaco.editor.createModel(alloyDefs, 'typescript', uri);
      }
    }
  }, [editor, onExecute, stageRef]);

  useEffect(() => {
    const defs = generateAlloyVariablesModel(variables);
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([
      {
        content: D3_TOTAL_DEFS,
        filePath: `helpers.ts`
      },
      {
        content: alloyDefs + '\n' + defs,
        filePath: 'alloy.js' 
      },
      {
        content: defs,
        filePath: `variables.ts`
      }
    ]);
  }, [editor, variables]);

  return (    
    <MonacoEditor      
      data-testid='script-view-monaco-editor'
      language='javascript'
      options={{
        automaticLayout: true,
        scrollBeyondLastLine: false,
        scrollbar: {
          verticalScrollbarSize: 12
        },
        value: initialText
      }}
      editorDidMount={editorDidMount}
      editorWillUnmount={(editor) => {
        const value = editor.getValue();
        beforeUnmount(value);
      }}
    />
  );
};

export { ScriptEditor };
