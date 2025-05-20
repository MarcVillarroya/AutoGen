import React, { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface GeneratedCodeSectionProps {
  generatedCode: string;
  onRun?: (code: string) => void;
  running?: boolean;
  runResult?: string;
  onSave?: (code: string, filename: string) => void;
  canSave?: boolean;
  // Props para URL y controles de grabación
  isRecording?: boolean;
  recording?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  url?: string;
  onUrlChange?: (url: string) => void;
  recordingFilename?: string;
  onRecordingFilenameChange?: (filename: string) => void;
}

const GeneratedCodeSection: React.FC<GeneratedCodeSectionProps> = ({
  generatedCode,
  onRun,
  running,
  runResult,
  onSave,
  canSave,
  // Props para URL y controles de grabación
  isRecording = false,
  onStartRecording,
  onStopRecording,
  url = '',
  onUrlChange,
}) => {
  const [code, setCode] = useState(generatedCode);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [filename, setFilename] = useState('');
  const [saveError, setSaveError] = useState('');

  React.useEffect(() => {
    setCode(generatedCode);
  }, [generatedCode]);

  const handleSave = () => {
    let finalFilename = filename.trim();
    if (!finalFilename) {
      setSaveError('Introduce un nombre de archivo.');
      return;
    }
    if (!finalFilename.endsWith('.spec.ts')) {
      if (/^[a-zA-Z0-9_-]+$/.test(finalFilename)) {
        finalFilename += '.spec.ts';
      } else {
        setSaveError('Nombre inválido. Usa solo letras, números, guiones (-) o guiones bajos (_), o escribe el nombre completo terminado en .spec.ts (ej: mi-prueba.spec.ts).');
        return;
      }
    }
    if (!/^[a-zA-Z0-9_-]+\.spec\.ts$/.test(finalFilename)) {
      setSaveError('Formato de nombre de archivo inválido. Debe ser como "nombre-archivo.spec.ts" y el nombre base no puede estar vacío ni contener caracteres especiales.');
      return;
    }
    setSaveError('');
    setShowSavePrompt(false);
    if (onSave) onSave(code, finalFilename);
  };
  // Función para manejar el cambio de URL si está disponible
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUrlChange) {
      onUrlChange(e.target.value);
    }
  };

  return (
    <section className="mt-4 relative">
      <div className="flex flex-col gap-3">
        {/* Primera fila: Título a la izquierda y URL + controles a la derecha */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-7 h-7 text-blue-400 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
            <h2 className="text-3xl font-bold text-blue-300 drop-shadow">Código Generado</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              className="px-4 py-2 rounded-lg text-white w-64 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all shadow-md bg-gray-800 placeholder-gray-400"
              placeholder="https://tu-sitio.com"
            />
            <div className="bg-gray-800 rounded-lg p-1">
              <button
                onClick={isRecording ? onStopRecording : onStartRecording}
                className={`px-4 py-1.5 rounded-lg font-semibold text-white transition-colors duration-200 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isRecording ? 'Detener' : 'Grabar'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Segunda fila: Botones de ejecución y guardado */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {onRun && (
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-2"
                onClick={() => onRun(code)}
                disabled={running || !code.trim()}
              >
                {running ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    Ejecutando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <polygon points="5,3 19,10 5,17" />
                    </svg>
                    Ejecutar Playwright
                  </>
                )}
              </button>
            )}
            {onSave && (
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                onClick={() => setShowSavePrompt(true)}
                disabled={!canSave || !code.trim()}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Guardar
              </button>
            )}
          </div>
          
          {/* Espacio para estado de grabación o mensajes */}
          {isRecording && (
            <div className="text-yellow-400 font-semibold flex items-center">
              <svg className="w-4 h-4 mr-1 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              Grabando...
            </div>
          )}
        </div>
      </div>
      {/* Modal simple para el nombre del archivo */}
      {showSavePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-80 flex flex-col gap-3">
            <label className="text-blue-300 font-semibold">Nombre del archivo .spec.ts</label>
            <input
              className="p-2 rounded bg-gray-700 text-white border border-blue-500 focus:outline-none"
              value={filename}
              onChange={e => setFilename(e.target.value)}
              placeholder="ejemplo.spec.ts"
              autoFocus
            />
            {saveError && <div className="text-red-400 text-xs">{saveError}</div>}
            <div className="flex gap-2 mt-2">
              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1"
                onClick={handleSave}
              >Guardar</button>
              <button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded px-3 py-1"
                onClick={() => setShowSavePrompt(false)}
              >Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg p-5 overflow-x-auto resize-y h-96 min-h-40 max-h-[70vh] border border-blue-700 relative">
        <Editor
          value={code || ''}
          onValueChange={setCode}
          highlight={code => Prism.highlight(code, Prism.languages.tsx, 'tsx')}
          padding={16}
          className="text-sm font-mono min-h-full outline-none text-blue-200 bg-transparent"
          style={{ minHeight: '100%', background: 'none' }}
          placeholder="Aquí aparecerá el código tras detener la grabación."
        />
        <div className="absolute top-3 right-4 text-xs text-gray-400 select-none">auto-gen</div>
      </div>
      {runResult && (
        <div className="mt-4 bg-gray-900 border border-blue-800 rounded-lg p-4 text-xs text-white whitespace-pre-wrap max-h-60 overflow-y-auto">
          <div className="font-bold text-blue-400 mb-2">Resultado de la ejecución:</div>
          <div className="font-mono space-y-1">
            {runResult
              .replace(/^```|```$/gm, '')
              .split(/\r?\n/)
              .map((line, idx) => {
                if (/passed/i.test(line)) {
                  return (
                    <div key={idx} className="text-green-400 font-bold flex items-center gap-1">
                      <span>✔️</span> {line}
                    </div>
                  );
                }
                if (/failed|error/i.test(line)) {
                  return (
                    <div key={idx} className="text-red-400 font-bold flex items-center gap-1">
                      <span>❌</span> {line}
                    </div>
                  );
                }
                if (/running/i.test(line)) {
                  return (
                    <div key={idx} className="text-blue-300">{line}</div>
                  );
                }
                if (/playwright-temp.*\.spec\.ts/i.test(line)) {
                  return (
                    <div key={idx} className="text-yellow-300">{line}</div>
                  );
                }
                return <div key={idx}>{line}</div>;
              })}
          </div>
        </div>
      )}
    </section>
  );
};

export default GeneratedCodeSection;
