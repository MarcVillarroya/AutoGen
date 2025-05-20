// server/playwrightService.ts
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

class PlaywrightServerService {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private outputFile = '';
  public lastGeneratedCode: string | null = null;

  // Inicia el proceso de Playwright Codegen para la URL dada
  start(url: string, onError: (err: string) => void) {
    console.log('[PlaywrightService] start called with url:', url);
    if (this.proc) {
      console.log('[PlaywrightService] start: process already running');
      onError('Ya hay una grabación en curso');
      return;
    }

    // Fichero temporal para volcar el código generado
    this.outputFile = path.join(os.tmpdir(), `autogen-${Date.now()}.ts`);
    console.log('[PlaywrightService] outputFile:', this.outputFile);
    this.proc = spawn('npx', ['playwright', 'codegen', `--output=${this.outputFile}`, url], {
      shell: true,
    });
    console.log('[PlaywrightService] codegen process started, pid:', this.proc.pid);

    // Captura errores del proceso hijo
    this.proc.stderr.on('data', data => {
      console.error('[PlaywrightService] STDERR:', data.toString());
      onError(data.toString());
    });

    // Al cerrar el proceso, lee el código generado y lo guarda en memoria
    this.proc.on('close', async code => {
      console.log('[PlaywrightService] codegen process closed with code:', code);
      if (code !== 0) {
        onError(`Codegen terminó con código ${code}`);
      }
      try {
        this.lastGeneratedCode = await fs.readFile(this.outputFile, 'utf-8');
        console.log('[PlaywrightService] codegen closed, generated code length:', this.lastGeneratedCode.length);
      } catch (e) {
        this.lastGeneratedCode = '';
        console.error('[PlaywrightService] readFile error (close):', e);
      }
      this.proc = null;
    });
  }

  // Detiene el proceso de Playwright Codegen y devuelve el código generado
  async stop(): Promise<string> {
    console.log('[PlaywrightService] stop called');
    if (this.proc) {
      console.log('[PlaywrightService] killing process pid:', this.proc.pid);
      this.proc.kill();
      await new Promise<void>(resolve =>
        this.proc!.on('close', () => resolve())
      );
      console.log('[PlaywrightService] process killed');
    }
    // Devuelve el código en memoria si existe, si no lo lee del fichero
    if (this.lastGeneratedCode !== null) {
      const code = this.lastGeneratedCode;
      this.lastGeneratedCode = null; // Limpiar para la siguiente grabación
      return code;
    }
    try {
      const code = await fs.readFile(this.outputFile, 'utf-8');
      return code;
    } catch (e) {
      return '';
    }
  }
}

// Exporta una instancia única del servicio
export default new PlaywrightServerService();
