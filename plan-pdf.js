import {getDocument, GlobalWorkerOptions} from './pdf.min.mjs';

GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', import.meta.url).href;

// Update these two values when a new plan is uploaded. The title follows its filename.
export const PLAN_FILE = {name: 'Piano Ottobre.pdf', url: './Piano-Ottobre.pdf', uploadedAt: '2026-10-11T00:18:45+02:00'};
const months = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const month = months.findIndex(value => PLAN_FILE.name.toLowerCase().includes(value));
const year = Number(PLAN_FILE.name.match(/\b20\d{2}\b/)?.[0] || PLAN_FILE.uploadedAt.slice(0,4));
export const PLAN_METADATA = {
  month: month + 1,
  year,
  title: (month >= 0 ? months[month] : PLAN_FILE.name.replace(/\.pdf$/i,'').replace(/^piano\s*/i,'')) .toUpperCase() + ' ' + year,
  updated: PLAN_FILE.uploadedAt.slice(8,10) + '.' + PLAN_FILE.uploadedAt.slice(5,7),
};

let documentPromise;
const rendered = new WeakSet();
export async function renderWorkPlanPdf(canvas) {
  if (!canvas || rendered.has(canvas)) return;
  rendered.add(canvas);
  const surface = canvas.parentElement;
  try {
    documentPromise ||= getDocument({url: PLAN_FILE.url + '?updated=' + encodeURIComponent(PLAN_FILE.uploadedAt), isEvalSupported: false}).promise;
    const pdf = await documentPromise;
    const page = await pdf.getPage(1);
    const scale = 2.5;
    const viewport = page.getViewport({scale});
    const fullPage = document.createElement('canvas');
    fullPage.width = Math.ceil(viewport.width);
    fullPage.height = Math.ceil(viewport.height);
    await page.render({canvasContext: fullPage.getContext('2d'), viewport}).promise;
    // Crop only the PDF's blank margins and signature; keep the complete work table.
    const crop = {x:17, y:53, width:1056, height:695};
    canvas.width = 2800;
    canvas.height = 1844;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(fullPage,crop.x*scale,crop.y*scale,crop.width*scale,crop.height*scale,0,0,canvas.width,canvas.height);
    fullPage.width = fullPage.height = 0;
    surface.dataset.status = 'ready';
  } catch (error) {
    rendered.delete(canvas);
    surface.dataset.status = 'error';
    console.error('Work-plan PDF rendering failed', error);
  }
}
