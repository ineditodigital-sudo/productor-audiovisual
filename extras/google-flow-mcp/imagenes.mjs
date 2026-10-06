// Runner por lotes de imágenes Nano Banana con el código parcheado del MCP (sin reiniciar el servidor MCP).
// Uso: node imagenes.mjs trabajos.json carpeta_salida
// trabajos.json: { "project": "<id>", "jobs": [ { "name": "x", "prompt": "...", "aspect": "1:1", "model": "Nano Banana Pro" } ] }
import { readFileSync, existsSync } from 'fs';
import { FlowBrowser, optionsFromEnv } from './dist/browser.js';
import { FlowClient } from './dist/flow.js';
import { downloadTo } from './dist/export.js';
const [, , jobsFile, outDir] = process.argv;
const cfg = JSON.parse(readFileSync(jobsFile, 'utf8'));
const browser = new FlowBrowser(optionsFromEnv());
const flow = new FlowClient(browser);
const c0 = await flow.credits(); console.log('creditos inicio', c0);
for (const j of cfg.jobs) {
  if (existsSync(`${outDir}/${j.name}.png`) || existsSync(`${outDir}/${j.name}.mp4`)) { console.log('ya existe', j.name); continue; }
  try {
    if (j.type === 'video') {   // video Omni: cotiza, genera, espera y descarga
      const models = await flow.models();
      const model = models.find((m) => m.key === (j.modelKey || 'abra_t2v_6s'));
      const r = await flow.generateVideo({ projectId: cfg.project, prompt: j.prompt, model, aspect: j.aspect || '9:16', count: 1, maxCredits: j.maxCredits || 12 });
      const ids = r.jobs.map((x) => x.mediaId); console.log('cola', j.name, ids.join(','), 'creditos', r.quotedCredits);
      const w = await flow.waitForVideos(ids, 900);
      for (const it of w.items) { if (it.state === 'succeeded') { const p = await downloadTo(it.videoUrl, j.name + '.mp4', outDir); console.log('ok', j.name, p); } else console.log('ERROR', j.name, it.state); }
      continue;
    }
    const res = await flow.generateImages({ projectId: cfg.project, prompt: j.prompt, aspect: j.aspect || '1:1', count: 1, model: j.model === 'keep' ? undefined : j.model });
    for (const [i, m] of res.entries()) {
      const media = await flow.getMedia(m.mediaId);
      const p = await downloadTo(media.imageUrl ?? m.url, `${j.name}${i ? '_' + i : ''}.png`, outDir);
      console.log('ok', j.name, m.mediaId, p);
    }
  } catch (e) { console.log('ERROR', j.name, String(e.message).split(String.fromCharCode(10))[0]); try { const pg = await browser.ready(); await pg.keyboard.press('Escape'); await pg.waitForTimeout(500); await pg.keyboard.press('Escape'); } catch (e2) {} }
}
console.log('creditos fin', await flow.credits());
process.exit(0);
