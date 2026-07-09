import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { SKETCH_TEMPLATES } from '../../utils/arduinoInterpreter';
import { Play, Square, ChevronDown, Code2 } from 'lucide-react';

const CodeEditorPanel = ({ onRun, onStop, isRunning }) => {
  const [code, setCode] = useState(SKETCH_TEMPLATES['Blink LED']);
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] border-l border-lab-border">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-dark border-b border-lab-border shrink-0">
        <Code2 className="h-3.5 w-3.5 text-violet-400" />
        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest flex-grow">Arduino Sketch</span>

        {/* Template picker */}
        <div className="relative">
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="flex items-center gap-1 px-2 py-1 bg-lab-surface hover:bg-lab-surface-hover text-text-muted rounded text-[8px] font-black uppercase tracking-widest transition-all"
          >
            Templates <ChevronDown className="h-2.5 w-2.5" />
          </button>
          {showTemplates && (
            <div className="absolute right-0 top-full mt-1 bg-surface-dark border border-lab-border-light rounded-sm shadow-2xl z-50 w-44">
              {Object.keys(SKETCH_TEMPLATES).map(name => (
                <button
                  key={name}
                  onClick={() => { setCode(SKETCH_TEMPLATES[name]); setShowTemplates(false); }}
                  className="w-full text-left px-3 py-2 text-[9px] font-bold text-text-muted hover:bg-lab-surface hover:text-white transition-all first:rounded-t-xl last:rounded-b-xl"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Run/Stop */}
        {!isRunning ? (
          <button
            onClick={() => onRun(code)}
            className="flex items-center gap-1.5 px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-[8px] font-black uppercase tracking-widest transition-all"
          >
            <Play className="h-2.5 w-2.5" /> Upload & Run
          </button>
        ) : (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-status-danger text-white rounded text-[8px] font-black uppercase tracking-widest animate-pulse transition-all"
          >
            <Square className="h-2.5 w-2.5" /> Stop
          </button>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="flex-grow overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="cpp"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            wordWrap: 'on',
            padding: { top: 8 },
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        />
      </div>
    </div>
  );
};

export default CodeEditorPanel;
