import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import playwrightService from './playwrightService';
import { runPlaywrightTest } from './playwrightRunService';
import fs from 'fs/promises';
import path from 'path';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Asegurar que existan las carpetas necesarias
async function ensureDirectories() {
  const tempDir = path.join(process.cwd(), 'playwright-temp');
  const savedDir = path.join(process.cwd(), 'playwright-saved');
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(savedDir, { recursive: true });
  console.log('Directorios creados: playwright-temp, playwright-saved');
}

// Aseguramos que existan las carpetas al iniciar el servidor
ensureDirectories().catch(err => {
  console.error('Error al crear directorios:', err);
});

// Inicia la grabación/playwright con la URL proporcionada
app.post('/api/start', (req, res) => {
  const { url } = req.body as { url: string };
  console.log('[API] /api/start called with url:', url);
  playwrightService.start(
    url,
    err => console.error('[PlaywrightService] Error:', err)
  );
  res.status(200).end(); // sólo confirmamos el arranque
});

// Detiene la grabación/playwright y devuelve el código generado
app.post('/api/stop', async (_req: Request, res: Response) => {
  console.log('[API] /api/stop called');
  try {
    const code = await playwrightService.stop();
    console.log('[API] /api/stop returning code length:', code.length);
    res.json({ code });
  } catch (error) {
    console.error('[API] /api/stop] Error stopping service:', error);
    res.status(500).json({ error: 'Error deteniendo Playwright', details: error instanceof Error ? error.stack : String(error) });
  }
});

// Devuelve el último código generado y lo limpia
app.post('/api/code', (_req: Request, res: Response) => {
  const code = playwrightService.lastGeneratedCode;
  if (code !== null) {
    playwrightService.lastGeneratedCode = null;
    res.json({ code });
  } else {
    res.json({ code: null });
  }
});

// Limpia el código recibido antes de ejecutarlo como test Playwright
function cleanPlaywrightCode(code: string): string {
  let cleaned = code.trim();
  // Asegura una sola importación de test y expect
  cleaned = cleaned.replace(/^(import\s+\{[^}]+\}\s+from\s+'@playwright\/test';?\s*)+/m,
    "import { test, expect } from '@playwright/test';\n");
  return cleaned;
}

// Ejecuta el código recibido como test de Playwright y devuelve el resultado
app.post('/api/run', async (req: Request, res: Response): Promise<void> => {
  // Extraemos y validamos el código del body
  const { code } = req.body as { code: string };
  if (typeof code !== 'string') {
    res.status(400).json({ error: 'Falta el campo code en el body' });
    return;
  }
  // Limpiamos imports duplicados y espacios
  const cleanedCode = cleanPlaywrightCode(code);

  try {
    const result = await runPlaywrightTest(cleanedCode);
    res.json({ output: result.output });
  } catch (error) {
    // Log detallado en consola
    console.error('[API /api/run] Error ejecutando Playwright:', error);
    // Devuelve también la stack al cliente
    const details = error instanceof Error ? error.stack : String(error);
    res
      .status(500)
      .json({ error: 'Error ejecutando Playwright', details });
  }
});

// Limpia todos los archivos temporales en playwright-temp
app.post('/api/clean-temp', async (_req: Request, res: Response) => {
  try {
    const tempDir = path.join(process.cwd(), 'playwright-temp');
    await fs.mkdir(tempDir, { recursive: true });
    const files = await fs.readdir(tempDir);
    for (const file of files) {
      if (/^autogen-test-.*\.spec\.ts$/.test(file)) {
        await fs.unlink(path.join(tempDir, file));
      }
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error limpiando temporales', details: String(e) });
  }
});

// Lista todos los archivos guardados en playwright-saved
app.get('/api/saved-specs', async (_req: Request, res: Response) => {
  try {
    const savedDir = path.join(process.cwd(), 'playwright-saved');
    await fs.mkdir(savedDir, { recursive: true });
    const files = await fs.readdir(savedDir);
    const specs = files.filter(file => file.endsWith('.spec.ts'));
    res.json({ specs });
  } catch (e) {
    res.status(500).json({ error: 'Error listando archivos guardados', details: String(e) });
  }
});

// Obtiene el contenido de un archivo guardado
app.get('/api/saved-spec/:filename', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { filename } = req.params;
    if (!filename || !filename.endsWith('.spec.ts')) {
      res.status(400).json({ error: 'Nombre de archivo inválido' });
      return;
    }

    const savedDir = path.join(process.cwd(), 'playwright-saved');
    const filePath = path.join(savedDir, filename);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      res.json({ code: content });
    } catch (e) {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo archivo', details: String(e) });
  }
});

// Guarda el código recibido como archivo .spec.ts en playwright-saved
app.post('/api/save-spec', async (req: Request, res: Response): Promise<void> => {
  const { code, filename } = req.body;
  if (!filename || !/^[\w-]+\.spec\.ts$/.test(filename)) {
    res.status(400).json({ error: 'Nombre de archivo inválido' });
    return;
  }
  try {
    const savedDir = path.join(process.cwd(), 'playwright-saved');
    await fs.mkdir(savedDir, { recursive: true });
    const filePath = path.join(savedDir, filename);
    await fs.writeFile(filePath, code, 'utf-8');
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error guardando archivo', details: String(e) });
  }
});

// Elimina un archivo .spec.ts guardado en playwright-saved
app.delete('/api/saved-spec/:filename', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    if (!filename || !filename.endsWith('.spec.ts')) {
      res.status(400).json({ error: 'Nombre de archivo inválido' });
      return;
    }

    const savedDir = path.join(process.cwd(), 'playwright-saved');
    const filePath = path.join(savedDir, filename);

    await fs.access(filePath);
    await fs.unlink(filePath);

    res.json({ ok: true });
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      res.status(404).json({ error: 'Archivo no encontrado' });
    } else {
      res.status(500).json({ error: 'Error eliminando archivo', details: String(e) });
    }
  }
});

// Arranca el servidor en el puerto 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Backend en http://localhost:${PORT}`));
