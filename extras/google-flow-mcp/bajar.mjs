import { FlowBrowser, optionsFromEnv } from './dist/browser.js';
import { FlowClient } from './dist/flow.js';
import { downloadTo } from './dist/export.js';
const [, , id, name, out] = process.argv;
const flow = new FlowClient(new FlowBrowser(optionsFromEnv()));
const m = await flow.getMedia(id); console.log(await downloadTo(m.videoUrl ?? m.imageUrl, name, out)); process.exit(0);
