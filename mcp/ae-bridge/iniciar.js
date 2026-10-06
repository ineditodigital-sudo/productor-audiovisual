#!/usr/bin/env node
// Lanzador del ae-bridge: la primera vez instala sus dependencias (npm) y luego arranca el servidor MCP.
// Todo lo que imprime npm va a stderr para no ensuciar el canal MCP (stdout).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const aqui = __dirname;
if (!fs.existsSync(path.join(aqui, 'node_modules', '@modelcontextprotocol'))) {
  process.stderr.write('[ae-bridge] Instalando dependencias (solo la primera vez)...\n');
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['install', '--omit=dev', '--no-audit', '--no-fund'], {
    cwd: aqui, stdio: ['ignore', 2, 2], shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    process.stderr.write('[ae-bridge] Falló npm install. Corre a mano: cd mcp/ae-bridge && npm install\n');
    process.exit(1);
  }
}
require('./index.js');
