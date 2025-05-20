// src/App.tsx
import { useState, useEffect } from 'react';
import GeneratedCodeSection from './components/GeneratedCodeSection';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [url, setUrl] = useState<string>('https://example.com');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | undefined>(undefined);
  // Estado para saber si la grabación ha terminado
  const [grabacionFinalizada, setGrabacionFinalizada] = useState(false);
  // Estado para el nombre de la grabación
  const [recordingFilename, setRecordingFilename] = useState('');
  // Estado para saber si está grabando
  const [recording, setRecording] = useState(false);

  // Polling para obtener el código generado mientras se graba
  useEffect(() => {
    if (!isRecording && !recording) return;
    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/code`, { method: 'POST' })
        .then(res => res.json())
        .then(({ code }) => {
          if (code) {
            setGeneratedCode(code);
            setIsRecording(false);
            setRecording(false);
            setGrabacionFinalizada(true); // Asegura que se pueda guardar
            clearInterval(interval);
          }
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording, recording]);

  // Inicia la grabación
  const handleStart = async () => {
    setGeneratedCode('');
    setIsRecording(true);
    setRecording(true);
    setGrabacionFinalizada(false);
    // Limpia archivos temporales
    await fetch(`${API_BASE}/api/clean-temp`, { method: 'POST' });
    fetch(`${API_BASE}/api/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, filename: recordingFilename }),
    });
  };

  // Detiene la grabación manualmente
  const handleStop = () => {
    fetch(`${API_BASE}/api/stop`, { method: 'POST' })
      .then(res => res.json())
      .then(({ code }) => {
        setGeneratedCode(code);
        setIsRecording(false);
        setRecording(false);
        setGrabacionFinalizada(true);
      });
  };

  // Lógica de guardado de archivo .spec.ts
  const handleSave = (code: string, filename: string) => {
    fetch(`${API_BASE}/api/save-spec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, filename }),
    })
      .then(() => alert('Archivo guardado correctamente'))
      .catch(() => alert('Error al guardar el archivo'));
  };

  const handleRun = async (code: string) => {
    setRunning(true);
    setRunResult(undefined);
    try {
      const res = await fetch(`${API_BASE}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Al fallar, muestra error + detalles
        setRunResult(`❌ ${data.error}\n${data.details}`);
      } else {
        setRunResult(data.output || 'Sin salida');
      }
    } catch (e) {
      setRunResult(`🚨 Error de red o interno: ${String(e)}`);
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-stretch justify-center">
      <div className="flex flex-col flex-1 items-center justify-center w-full">
        <div className="w-full h-full max-w-full bg-gray-950 bg-opacity-90 rounded-none shadow-2xl p-8 border border-gray-800 flex flex-col flex-1 min-h-[80vh] min-w-0">
          <h1 className="text-3xl font-bold mb-6 text-center text-cyan-400 drop-shadow">AutoGen Playwright</h1>
          
          <div className="flex-1 flex flex-col min-h-0">
            <GeneratedCodeSection
              generatedCode={generatedCode}
              onRun={handleRun}
              running={running}
              runResult={runResult}
              canSave={grabacionFinalizada}
              onSave={handleSave}
              // Props para URL y controles de grabación
              isRecording={isRecording}
              recording={recording}
              onStartRecording={handleStart}
              onStopRecording={handleStop}
              url={url}
              onUrlChange={setUrl}
              recordingFilename={recordingFilename}
              onRecordingFilenameChange={setRecordingFilename}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
