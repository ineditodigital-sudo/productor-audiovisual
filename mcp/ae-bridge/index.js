#!/usr/bin/env node
/**
 * ae-bridge - Puente MCP para Adobe After Effects.
 *
 * No usa extensiones CEP. Ejecuta ExtendScript arbitrario invocando
 *   AfterFX.exe -r <script.jsx>
 * sobre la instancia de AE que ya esta corriendo. El script escribe su
 * resultado en un JSON temporal que este servidor lee y devuelve.
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// --------------------------------------------------------------------------
// Localizar AfterFX.exe
// --------------------------------------------------------------------------

// IMPORTANTE: en Windows hay dos lanzadores en Support Files.
//   AfterFX.exe -> version GUI. El flag -r suele ser ignorado silenciosamente.
//   AfterFX.com -> version consola. -r y -s funcionan de forma fiable.
// Por eso se prefiere SIEMPRE el .com cuando existe.
const CARPETAS = [
  process.env.AE_DIR,
  'C:\\Program Files\\Adobe\\Adobe After Effects 2026\\Support Files',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2024\\Support Files',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2023\\Support Files',
  'C:\\Program Files\\Adobe\\Adobe After Effects 2022\\Support Files',
].filter(Boolean);

function buscarEn(dir) {
  const com = path.join(dir, 'AfterFX.com');
  if (fs.existsSync(com)) return com;
  const exe = path.join(dir, 'AfterFX.exe');
  if (fs.existsSync(exe)) return exe;
  return null;
}

function buscarAE() {
  if (process.env.AE_EXE && fs.existsSync(process.env.AE_EXE)) return process.env.AE_EXE;
  for (const d of CARPETAS) {
    const r = buscarEn(d);
    if (r) return r;
  }
  const raiz = 'C:\\Program Files\\Adobe';
  try {
    for (const d of fs.readdirSync(raiz)) {
      if (!/After Effects/i.test(d)) continue;
      const r = buscarEn(path.join(raiz, d, 'Support Files'));
      if (r) return r;
    }
  } catch (_) { /* ignorar */ }
  return null;
}

const AE_EXE = buscarAE();
const USA_COM = !!AE_EXE && /\.com$/i.test(AE_EXE);
const TMP = path.join(os.tmpdir(), 'ae-bridge');
fs.mkdirSync(TMP, { recursive: true });

function aeCorriendo() {
  return new Promise((resolve) => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq AfterFX.exe', '/NH'], (err, stdout) => {
      resolve(!err && /AfterFX\.exe/i.test(stdout || ''));
    });
  });
}

// --------------------------------------------------------------------------
// JSON.stringify para ExtendScript (ES3 no lo trae)
// --------------------------------------------------------------------------

const STRINGIFY_ES3 = `
function __esc(s){
  s = String(s);
  var o = '', c;
  for (var i = 0; i < s.length; i++) {
    c = s.charAt(i);
    if (c === '"') { o += '\\\\"'; }
    else if (c === '\\\\') { o += '\\\\\\\\'; }
    else if (c === '\\n') { o += '\\\\n'; }
    else if (c === '\\r') { o += '\\\\r'; }
    else if (c === '\\t') { o += '\\\\t'; }
    else if (s.charCodeAt(i) < 32 || s.charCodeAt(i) > 126) {
      var h = s.charCodeAt(i).toString(16);
      while (h.length < 4) { h = '0' + h; }
      o += '\\\\u' + h;
    }
    else { o += c; }
  }
  return '"' + o + '"';
}
function __str(v, prof){
  prof = prof || 0;
  if (prof > 12) { return '"[demasiado profundo]"'; }
  if (v === null || v === undefined) { return 'null'; }
  var t = typeof v;
  if (t === 'number') { return isFinite(v) ? String(v) : 'null'; }
  if (t === 'boolean') { return v ? 'true' : 'false'; }
  if (t === 'string') { return __esc(v); }
  if (v instanceof Array) {
    var a = [];
    for (var i = 0; i < v.length; i++) { a.push(__str(v[i], prof + 1)); }
    return '[' + a.join(',') + ']';
  }
  if (t === 'object') {
    var o = [];
    for (var k in v) {
      if (!v.hasOwnProperty(k)) { continue; }
      try { o.push(__esc(k) + ':' + __str(v[k], prof + 1)); } catch (e) {}
    }
    return '{' + o.join(',') + '}';
  }
  return __esc(String(v));
}
`;

// --------------------------------------------------------------------------
// Ejecutor
// --------------------------------------------------------------------------

let contador = 0;

function envolver(codigo, rutaResultado, undoNombre, guardarEn, cerrarDespues) {
  const abrirUndo = undoNombre ? `app.beginUndoGroup(${JSON.stringify(undoNombre)});` : '';
  const cerrarUndo = undoNombre ? `try{app.endUndoGroup();}catch(e0){}` : '';

  // Guardado: si hay ruta se hace "guardar como" a esa ruta (asi nunca aparece
  // el dialogo de "guardar en..."), si no, guardado en sitio solo si el
  // proyecto ya tiene archivo.
  const guardado = typeof guardarEn === 'string' ? `
  try {
    var __pf = new File(${JSON.stringify(guardarEn.replace(/\\/g, '/'))});
    var __pd = __pf.parent;
    if (!__pd.exists) { __pd.create(); }
    app.project.save(__pf);
    __out.guardado = __pf.fsName;
  } catch (eg) { __out.guardado_error = eg.toString(); }
  ` : `
  try {
    if (app.project.file) { app.project.save(); __out.guardado = app.project.file.fsName; }
    else { __out.guardado_error = 'El proyecto no tiene archivo. Usa ae_autoguardado o ae_guardar con ruta.'; }
  } catch (eg) { __out.guardado_error = eg.toString(); }
  `;

  const cierre = cerrarDespues ? `
  try { app.quit(); } catch (eq) {}
  ` : '';

  return `${STRINGIFY_ES3}
(function(){
  var __out = { ok: true, resultado: null, error: null, log: [] };
  function log(m){ __out.log.push(String(m)); }
  ${abrirUndo}
  try {
    __out.resultado = (function(){
${codigo}
    })();
  } catch (e) {
    __out.ok = false;
    __out.error = e.toString() + (e.line ? (' [linea ' + e.line + ']') : '');
  }
  ${cerrarUndo}
  ${guardarEn === false || guardarEn === undefined ? '' : guardado}
  try {
    var __f = new File(${JSON.stringify(rutaResultado)});
    __f.encoding = 'UTF-8';
    __f.open('w');
    __f.write(__str(__out));
    __f.close();
  } catch (e2) {
    // Si esto falla, casi siempre es la preferencia de seguridad de scripts.
  }
  ${cierre}
})();
`;
}

/**
 * Lanza un .jsx dentro de After Effects.
 * Con AfterFX.com se usa -r (fiable). Con AfterFX.exe, -r se ignora en
 * algunas instalaciones, asi que se usa -s con un bootstrap minimo que
 * hace evalFile del script real.
 */
function lanzar(rutaScript) {
  const args = USA_COM
    ? ['-r', rutaScript]
    : ['-s', `$.evalFile(${JSON.stringify(rutaScript.replace(/\\/g, '/'))});`];
  const hijo = spawn(AE_EXE, args, { detached: true, stdio: 'ignore', windowsHide: true });
  hijo.unref();
}

// --------------------------------------------------------------------------
// Guardia de foco: AfterFX.com -r trae AE al frente en cada orden. Se recuerda
// la ventana activa antes de lanzar y se le devuelve el foco al terminar.
// Desactivar con la variable de entorno AE_BRIDGE_FOCO=0.
// --------------------------------------------------------------------------

const FOCO_ACTIVO = process.env.AE_BRIDGE_FOCO !== '0' && process.platform === 'win32';
let focoProc = null;
let focoBuffer = '';
const focoEspera = [];

function focoIniciar() {
  if (!FOCO_ACTIVO) return null;
  if (focoProc && !focoProc.killed && focoProc.exitCode === null) return focoProc;
  try {
    focoBuffer = '';
    focoEspera.length = 0;
    focoProc = spawn('powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'foco.ps1')],
      { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
    focoProc.stdout.setEncoding('utf8');
    focoProc.stdout.on('data', (d) => {
      focoBuffer += d;
      let i;
      while ((i = focoBuffer.indexOf('\n')) >= 0) {
        const linea = focoBuffer.slice(0, i).trim();
        focoBuffer = focoBuffer.slice(i + 1);
        if (linea === 'listo') continue;
        const r = focoEspera.shift();
        if (r) r(linea);
      }
    });
    focoProc.on('exit', () => { focoProc = null; while (focoEspera.length) focoEspera.shift()(null); });
    focoProc.on('error', () => { focoProc = null; });
  } catch (_) { focoProc = null; }
  return focoProc;
}

function focoComando(linea, ms = 3000) {
  const p = focoIniciar();
  if (!p) return Promise.resolve(null);
  return new Promise((resolve) => {
    let hecho = false;
    const fin = (v) => { if (!hecho) { hecho = true; resolve(v); } };
    focoEspera.push(fin);
    setTimeout(() => fin(null), ms);
    try { p.stdin.write(linea + '\n'); } catch (_) { fin(null); }
  });
}

/** Devuelve el hwnd de la ventana activa si NO es After Effects (si el usuario estaba en AE, no se toca nada). */
async function focoGuardar() {
  const r = await focoComando('get');
  if (!r || r.indexOf('|') < 0) return null;
  const [hwnd, proc] = r.split('|');
  if (!hwnd || hwnd === '0' || /afterfx/i.test(proc || '')) return null;
  return hwnd;
}

async function focoRestaurar(hwnd) {
  if (!hwnd) return;
  await focoComando('set ' + hwnd);
  // AE a veces se reactiva un instante despues: segundo intento
  setTimeout(() => { focoComando('set ' + hwnd); }, 350);
}

// arrancar el ayudante desde ya (compilar el tipo tarda ~1 s)
focoIniciar();

function esperarArchivo(ruta, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    const tick = () => {
      if (fs.existsSync(ruta)) {
        // pequeña espera para asegurar escritura completa
        setTimeout(() => {
          try { resolve(fs.readFileSync(ruta, 'utf8')); }
          catch (e) { reject(e); }
        }, 60);
        return;
      }
      if (Date.now() - t0 > timeoutMs) {
        reject(new Error('timeout'));
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

// --------------------------------------------------------------------------
// Estado persistente (proyecto de trabajo / autoguardado)
// --------------------------------------------------------------------------

const RUTA_ESTADO = path.join(__dirname, 'estado.json');

function leerEstado() {
  try { return JSON.parse(fs.readFileSync(RUTA_ESTADO, 'utf8')); }
  catch (_) { return { proyecto: null, autoguardado: false, versiones: false }; }
}
function escribirEstado(e) {
  fs.writeFileSync(RUTA_ESTADO, JSON.stringify(e, null, 2), 'utf8');
}

/** Copia versionada del .aep, para no perder avance nunca. */
function copiaVersionada(rutaProyecto) {
  try {
    if (!fs.existsSync(rutaProyecto)) return null;
    const dir = path.join(path.dirname(rutaProyecto), '_versiones');
    fs.mkdirSync(dir, { recursive: true });
    const base = path.basename(rutaProyecto, '.aep');
    const t = new Date();
    const sello = `${t.getFullYear()}${String(t.getMonth() + 1).padStart(2, '0')}${String(t.getDate()).padStart(2, '0')}_${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}${String(t.getSeconds()).padStart(2, '0')}`;
    const destino = path.join(dir, `${base}_${sello}.aep`);
    fs.copyFileSync(rutaProyecto, destino);

    // Conservar solo las 30 versiones mas recientes
    const previas = fs.readdirSync(dir)
      .filter((f) => f.startsWith(base + '_') && f.endsWith('.aep'))
      .sort();
    while (previas.length > 30) {
      try { fs.unlinkSync(path.join(dir, previas.shift())); } catch (_) {}
    }
    return destino;
  } catch (e) {
    return null;
  }
}

async function ejecutarJSX(codigo, {
  timeout = 90000, undo = null, esperarResultado = true,
  guardarEn = false, cerrar = false,
} = {}) {
  if (!AE_EXE) {
    throw new Error('No se encontro AfterFX.exe/AfterFX.com. Define la variable de entorno AE_EXE con la ruta completa.');
  }

  const id = `${Date.now()}_${++contador}`;
  const rutaScript = path.join(TMP, `s_${id}.jsx`);
  const rutaResultado = path.join(TMP, `r_${id}.json`);

  fs.writeFileSync(rutaScript, envolver(codigo, rutaResultado, undo, guardarEn, cerrar), 'utf8');

  const corriendo = await aeCorriendo();
  const ventanaPrevia = corriendo ? await focoGuardar() : null;

  lanzar(rutaScript);

  if (!esperarResultado) {
    setTimeout(() => focoRestaurar(ventanaPrevia), 1200);
    return { ok: true, resultado: 'enviado (sin esperar resultado)', ae_estaba_abierto: corriendo };
  }

  const espera = corriendo ? timeout : Math.max(timeout, 180000); // arrancar AE tarda

  let crudo;
  try {
    crudo = await esperarArchivo(rutaResultado, espera);
  } catch (e) {
    focoRestaurar(ventanaPrevia);
    throw new Error(
      corriendo
        ? 'After Effects no devolvio resultado a tiempo. Causas tipicas: (1) hay un dialogo modal abierto en AE esperando respuesta, (2) falta activar "Permitir que las secuencias de comandos escriban archivos y accedan a la red" en Preferencias > Secuencias de comandos y expresiones (usa la herramienta ae_preparar), (3) la operacion tarda mas que el timeout.'
        : 'After Effects no estaba abierto y no respondio. Abrelo e intenta de nuevo.'
    );
  }

  // A veces el archivo existe pero AE aun no termina de escribirlo: reintentar la lectura
  let datos = null;
  for (let intento = 0; intento < 15 && datos === null; intento++) {
    try { datos = JSON.parse(crudo); }
    catch (e) {
      await new Promise((r) => setTimeout(r, 200));
      try { crudo = fs.readFileSync(rutaResultado, 'utf8'); } catch (_) {}
    }
  }

  // limpieza
  try { fs.unlinkSync(rutaScript); } catch (_) {}
  try { fs.unlinkSync(rutaResultado); } catch (_) {}

  await focoRestaurar(ventanaPrevia);

  if (datos === null) throw new Error('Respuesta ilegible de After Effects: ' + String(crudo).slice(0, 500));
  return datos;
}

function comoTexto(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

// --------------------------------------------------------------------------
// Servidor MCP
// --------------------------------------------------------------------------

const server = new McpServer({ name: 'ae-bridge', version: '1.0.0' });

server.tool(
  'ae_estado',
  'Comprueba si After Effects esta abierto y responde. Devuelve version, proyecto abierto y lista de composiciones. Usar SIEMPRE al inicio de una sesion de trabajo con AE.',
  {},
  async () => {
    const corriendo = await aeCorriendo();
    if (!AE_EXE) {
      return comoTexto({ ok: false, error: 'No se encontro AfterFX.exe', ae_abierto: corriendo });
    }
    if (!corriendo) {
      return comoTexto({
        ok: false,
        ae_abierto: false,
        ejecutable: AE_EXE,
        mensaje: 'After Effects no esta abierto. Pidele al usuario que lo abra antes de continuar.',
      });
    }
    try {
      const r = await ejecutarJSX(`
        var comps = [];
        for (var i = 1; i <= app.project.numItems; i++) {
          var it = app.project.item(i);
          if (it instanceof CompItem) {
            comps.push({
              nombre: it.name, ancho: it.width, alto: it.height,
              fps: it.frameRate, duracion: it.duration, capas: it.numLayers
            });
          }
        }
        return {
          version: app.version,
          proyecto: app.project.file ? app.project.file.fsName : '(sin guardar)',
          items: app.project.numItems,
          composiciones: comps
        };
      `, { timeout: 30000 });
      return comoTexto({ ok: true, ae_abierto: true, ejecutable: AE_EXE, ...r });
    } catch (e) {
      return comoTexto({ ok: false, ae_abierto: true, error: e.message });
    }
  }
);

server.tool(
  'ae_preparar',
  'Activa la preferencia de After Effects que permite a los scripts escribir archivos y acceder a la red. Es OBLIGATORIA para que el puente funcione. Ejecutar una sola vez, o cuando ae_estado de timeout.',
  {},
  async () => {
    if (!AE_EXE) return comoTexto({ ok: false, error: 'No se encontro AfterFX.exe' });
    const id = `prep_${Date.now()}`;
    const rutaScript = path.join(TMP, `${id}.jsx`);
    // Este script NO escribe archivos: solo cambia la preferencia y avisa.
    fs.writeFileSync(rutaScript, `
      app.preferences.savePrefAsLong("Main Pref Section",
        "Pref_SCRIPTING_FILE_NETWORK_SECURITY", 1,
        PREFType.PREF_Type_MACHINE_INDEPENDENT);
      app.preferences.saveToDisk();
      app.preferences.reload();
    `, 'utf8');
    lanzar(rutaScript);
    await new Promise((r) => setTimeout(r, 4000));
    return comoTexto({
      ok: true,
      mensaje: 'Preferencia activada. Verifica con ae_estado. Si sigue fallando, activala a mano en Editar > Preferencias > Secuencias de comandos y expresiones.',
    });
  }
);

server.tool(
  'ae_ejecutar',
  [
    'Ejecuta ExtendScript arbitrario dentro de After Effects y devuelve lo que el script retorne.',
    'Da acceso COMPLETO a la API de AE: comps, capas, keyframes, expresiones, efectos, mascaras, camaras, 3D, cola de render, Media Encoder, preferencias.',
    'El codigo se ejecuta dentro de una funcion: usa "return" para devolver datos. Hay una funcion log(mensaje) disponible.',
    'REGLAS: ExtendScript es ES3 - nada de arrow functions, let/const, template literals, JSON, Array.forEach, Object.keys.',
    'Colores en 0-1. Position/Scale son arrays. Tiempos en segundos.',
    'No dejes dialogos abiertos (alert, confirm, File.openDialog) o la llamada dara timeout.',
  ].join(' '),
  {
    codigo: z.string().describe('Codigo ExtendScript (ES3). Usa return para devolver el resultado.'),
    undo: z.string().optional().describe('Nombre del grupo de deshacer. Ponlo siempre que modifiques el proyecto.'),
    timeout_ms: z.number().optional().describe('Tiempo maximo de espera. Por defecto 90000.'),
    guardar: z.boolean().optional().describe('Forzar (true) o impedir (false) el guardado del proyecto tras ejecutar. Si se omite, se guarda cuando hay autoguardado activo y se paso "undo".'),
  },
  async ({ codigo, undo, timeout_ms, guardar }) => {
    const est = leerEstado();
    // Guarda si se pide explicitamente, o si hay autoguardado activo y esto
    // es una modificacion (undo presente).
    const debeGuardar = guardar === true || (guardar !== false && est.autoguardado && !!undo);
    const destino = debeGuardar ? (est.proyecto || true) : false;

    try {
      const r = await ejecutarJSX(codigo, {
        undo: undo || null,
        timeout: timeout_ms || 90000,
        guardarEn: destino,
      });
      if (r.guardado && est.versiones) {
        const v = copiaVersionada(r.guardado);
        if (v) r.version = v;
      }
      return comoTexto(r);
    } catch (e) {
      return comoTexto({ ok: false, error: e.message });
    }
  }
);

server.tool(
  'ae_autoguardado',
  'Define el archivo .aep de trabajo y activa el guardado automatico despues de CADA modificacion, mas copias versionadas con marca de tiempo en una subcarpeta _versiones. Configurar esto al empezar cualquier proyecto largo para no perder avance.',
  {
    proyecto: z.string().describe('Ruta completa del .aep en Windows, ej. E:\\RADAR IA\\proyecto\\radar.aep. Se crea la carpeta si no existe.'),
    activar: z.boolean().optional().describe('Activar el guardado automatico. Por defecto true.'),
    versiones: z.boolean().optional().describe('Guardar tambien copias con marca de tiempo en _versiones (se conservan las 30 mas recientes). Por defecto true.'),
  },
  async ({ proyecto, activar, versiones }) => {
    const est = leerEstado();
    est.proyecto = proyecto;
    est.autoguardado = activar !== false;
    est.versiones = versiones !== false;
    escribirEstado(est);
    return comoTexto({
      ok: true,
      proyecto: est.proyecto,
      autoguardado: est.autoguardado,
      versiones: est.versiones,
      nota: 'A partir de ahora cada ae_ejecutar con "undo" guarda el proyecto automaticamente.',
    });
  }
);

server.tool(
  'ae_guardar',
  'Guarda el proyecto de After Effects ahora mismo. Sin argumentos guarda en el archivo configurado con ae_autoguardado (o en su sitio si ya tiene archivo).',
  {
    ruta: z.string().optional().describe('Ruta .aep de destino. Si se omite, usa la configurada.'),
    version: z.boolean().optional().describe('Crear ademas una copia con marca de tiempo en _versiones. Por defecto sigue la configuracion.'),
  },
  async ({ ruta, version }) => {
    const est = leerEstado();
    const destino = ruta || est.proyecto || true;
    try {
      const r = await ejecutarJSX('return app.project.numItems;', {
        guardarEn: destino,
        timeout: 120000,
      });
      const quiereVersion = version === true || (version !== false && est.versiones);
      if (r.guardado && quiereVersion) {
        const v = copiaVersionada(r.guardado);
        if (v) r.version = v;
      }
      return comoTexto(r);
    } catch (e) {
      return comoTexto({ ok: false, error: e.message });
    }
  }
);

server.tool(
  'ae_cerrar',
  'Guarda el proyecto y cierra After Effects. Usar al terminar una tanda de trabajo para liberar la maquina. No devuelve confirmacion posterior al cierre porque AE se apaga.',
  {
    guardar: z.boolean().optional().describe('Guardar antes de cerrar. Por defecto true. Ponlo en false solo si de verdad quieres descartar los cambios.'),
    ruta: z.string().optional().describe('Ruta .aep donde guardar antes de cerrar. Si se omite, usa la configurada.'),
  },
  async ({ guardar, ruta }) => {
    const est = leerEstado();
    const corriendo = await aeCorriendo();
    if (!corriendo) return comoTexto({ ok: true, mensaje: 'After Effects ya estaba cerrado.' });

    const destino = guardar === false ? false : (ruta || est.proyecto || true);
    try {
      const r = await ejecutarJSX('return app.project.numItems;', {
        guardarEn: destino,
        cerrar: true,
        timeout: 120000,
      });
      if (r.guardado && est.versiones) {
        const v = copiaVersionada(r.guardado);
        if (v) r.version = v;
      }
      await new Promise((res) => setTimeout(res, 6000));
      const sigue = await aeCorriendo();
      return comoTexto({
        ...r,
        cerrado: !sigue,
        nota: sigue
          ? 'AE sigue en memoria. Puede haber un dialogo pidiendo confirmacion; revisa la pantalla.'
          : 'After Effects cerrado correctamente.',
      });
    } catch (e) {
      return comoTexto({ ok: false, error: e.message });
    }
  }
);

server.tool(
  'ae_ejecutar_archivo',
  'Ejecuta un archivo .jsx que ya existe en disco dentro de After Effects. Util para scripts largos o de terceros. No devuelve resultado estructurado.',
  {
    ruta: z.string().describe('Ruta completa al archivo .jsx en Windows.'),
  },
  async ({ ruta }) => {
    if (!AE_EXE) return comoTexto({ ok: false, error: 'No se encontro AfterFX.exe' });
    if (!fs.existsSync(ruta)) return comoTexto({ ok: false, error: 'No existe: ' + ruta });
    lanzar(ruta);
    return comoTexto({ ok: true, mensaje: 'Script enviado a After Effects: ' + ruta });
  }
);

server.tool(
  'ae_render',
  'Agrega composiciones a la cola de render de After Effects y opcionalmente la lanza. Para exportar a H.264 usa Media Encoder (enviar=false y luego Archivo > Exportar > Anadir a la cola de Adobe Media Encoder).',
  {
    composiciones: z.array(z.string()).describe('Nombres de las composiciones a renderizar.'),
    carpeta_salida: z.string().describe('Carpeta de destino en Windows, ej. C:\\Users\\<usuario>\\Videos'),
    plantilla_salida: z.string().optional().describe('Modulo de salida, ej. "Lossless", "H.264 - Match Render Settings". Por defecto el predeterminado.'),
    iniciar: z.boolean().optional().describe('Si es true, arranca el render inmediatamente. Por defecto false (solo encola).'),
  },
  async ({ composiciones, carpeta_salida, plantilla_salida, iniciar }) => {
    const codigo = `
      var nombres = ${JSON.stringify(composiciones)};
      var salida = ${JSON.stringify(carpeta_salida)};
      var plantilla = ${JSON.stringify(plantilla_salida || '')};
      var encoladas = [];
      for (var n = 0; n < nombres.length; n++) {
        var comp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
          var it = app.project.item(i);
          if (it instanceof CompItem && it.name === nombres[n]) { comp = it; break; }
        }
        if (!comp) { log('No se encontro la comp: ' + nombres[n]); continue; }
        var rq = app.project.renderQueue.items.add(comp);
        var om = rq.outputModule(1);
        if (plantilla !== '') { try { om.applyTemplate(plantilla); } catch (e) { log('Plantilla no valida: ' + plantilla); } }
        om.file = new File(salida + '\\\\' + comp.name);
        encoladas.push(comp.name);
      }
      ${iniciar ? 'if (encoladas.length > 0) { app.project.renderQueue.render(); }' : ''}
      return { encoladas: encoladas, total_en_cola: app.project.renderQueue.numItems };
    `;
    try {
      const r = await ejecutarJSX(codigo, {
        undo: 'Encolar render',
        timeout: iniciar ? 3600000 : 90000,
      });
      return comoTexto(r);
    } catch (e) {
      return comoTexto({ ok: false, error: e.message });
    }
  }
);

server.tool(
  'ae_inspeccionar',
  'Devuelve la estructura detallada de una composicion: capas, tipos, tiempos, efectos, propiedades animadas y expresiones. Usar antes de modificar algo para saber contra que estas trabajando.',
  {
    composicion: z.string().describe('Nombre de la composicion.'),
    con_propiedades: z.boolean().optional().describe('Incluir keyframes y expresiones de cada capa. Por defecto true.'),
  },
  async ({ composicion, con_propiedades }) => {
    const detalle = con_propiedades !== false;
    const codigo = `
      var nombre = ${JSON.stringify(composicion)};
      var comp = null;
      for (var i = 1; i <= app.project.numItems; i++) {
        var it = app.project.item(i);
        if (it instanceof CompItem && it.name === nombre) { comp = it; break; }
      }
      if (!comp) { throw new Error('No existe la composicion: ' + nombre); }

      function tipoCapa(l) {
        if (l instanceof TextLayer) return 'texto';
        if (l instanceof ShapeLayer) return 'forma';
        if (l instanceof CameraLayer) return 'camara';
        if (l instanceof LightLayer) return 'luz';
        if (l.nullLayer) return 'null';
        if (l.adjustmentLayer) return 'ajuste';
        if (l instanceof AVLayer) return 'av';
        return 'otra';
      }

      function propsAnimadas(grupo, ruta, acc, prof) {
        if (prof > 3) return;
        for (var p = 1; p <= grupo.numProperties; p++) {
          var pr = grupo.property(p);
          var r = ruta + ' > ' + pr.name;
          if (pr.propertyType === PropertyType.PROPERTY) {
            var info = null;
            if (pr.expressionEnabled) {
              info = { ruta: r, expresion: pr.expression };
            } else if (pr.numKeys > 0) {
              var ks = [];
              for (var k = 1; k <= pr.numKeys; k++) { ks.push(pr.keyTime(k)); }
              info = { ruta: r, keyframes: pr.numKeys, tiempos: ks };
            }
            if (info) acc.push(info);
          } else if (pr.numProperties > 0) {
            propsAnimadas(pr, r, acc, prof + 1);
          }
        }
      }

      var capas = [];
      for (var j = 1; j <= comp.numLayers; j++) {
        var l = comp.layer(j);
        var efectos = [];
        try {
          var fx = l.property('ADBE Effect Parade');
          if (fx) { for (var e = 1; e <= fx.numProperties; e++) { efectos.push(fx.property(e).name); } }
        } catch (e1) {}

        var reg = {
          indice: j,
          nombre: l.name,
          tipo: tipoCapa(l),
          entrada: l.inPoint,
          salida: l.outPoint,
          inicio: l.startTime,
          activa: l.enabled,
          tresD: l.threeDLayer,
          padre: l.parent ? l.parent.name : null,
          efectos: efectos
        };
        if (l instanceof TextLayer) {
          try { reg.texto = l.property('Source Text').value.text; } catch (e2) {}
        }
        ${detalle ? `
        var acc = [];
        try { propsAnimadas(l, l.name, acc, 0); } catch (e3) {}
        reg.animado = acc;
        ` : ''}
        capas.push(reg);
      }

      var marcadores = [];
      try {
        for (var m = 1; m <= comp.markerProperty.numKeys; m++) {
          marcadores.push({ tiempo: comp.markerProperty.keyTime(m),
                            comentario: comp.markerProperty.keyValue(m).comment });
        }
      } catch (e4) {}

      return {
        composicion: comp.name,
        ancho: comp.width, alto: comp.height, fps: comp.frameRate,
        duracion: comp.duration,
        area_trabajo: [comp.workAreaStart, comp.workAreaStart + comp.workAreaDuration],
        marcadores: marcadores,
        capas: capas
      };
    `;
    try {
      const r = await ejecutarJSX(codigo, { timeout: 60000 });
      return comoTexto(r);
    } catch (e) {
      return comoTexto({ ok: false, error: e.message });
    }
  }
);

// --------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  process.stderr.write('ae-bridge fallo: ' + e.stack + '\n');
  process.exit(1);
});
