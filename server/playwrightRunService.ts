import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import stripAnsi from 'strip-ansi';

// Variables para cachear el último código y archivo generado
let lastCode: string | null = null;
let lastFile: string | null = null;

/**
 * Guarda el código en un .spec.ts dentro de 'playwright-temp' y ejecuta Playwright.
 */
export async function runPlaywrightTest(code: string): Promise<{ output: string }> {
  // 1. Raíz del proyecto (donde está package.json)
  const projectRoot = process.cwd();
  // 2. Directorio para tests generados
  const testsDir = path.join(projectRoot, 'playwright-temp');
  console.log('📂 Tests dir:', testsDir);
  await fs.mkdir(testsDir, { recursive: true });

  // 3. Si el código es igual al último, reutiliza el archivo
  let testFile: string;
  if (lastCode === code && lastFile) {
    testFile = lastFile;
  } else {
    // Nombre de archivo con extensión .spec.ts
    const fileName = `autogen-test-${Date.now()}.spec.ts`;
    testFile = path.join(testsDir, fileName);
    console.log('📝 Writing test file:', testFile);
    await fs.writeFile(testFile, code, 'utf-8');
    lastCode = code;
    lastFile = testFile;
  }

  // 4. Calcula la ruta relativa al projectRoot para pasársela a Playwright
  let relativeTestPath = path.relative(projectRoot, testFile);
  // Convierte backslashes a slashes para compatibilidad en Windows
  relativeTestPath = relativeTestPath.split(path.sep).join('/');

  // 5. Ejecuta Playwright apuntando a la ruta relativa del fichero generado
  return new Promise(resolve => {
    const proc = spawn(
      'npx',
      ['playwright', 'test', relativeTestPath, '--reporter=list'],
      { cwd: projectRoot, shell: true }
    );

    let output = '';
    proc.stdout.on('data', data => output += data.toString());
    proc.stderr.on('data', data => output += data.toString());
    proc.on('close', () => {
      // Usa strip-ansi para limpiar cualquier código de color ANSI
      const cleanOutput = stripAnsi(output);
      // Devuelve el output envuelto en un bloque de código Markdown
      const formattedOutput = `\n\n\u0060\u0060\u0060\n${cleanOutput.trim()}\n\u0060\u0060\u0060\n`;
      resolve({ output: formattedOutput });
    });
  });
}
