// resume.pdf: compact, single-column resume for the site and ATS uploads (Workday etc.).
// The `even` theme (still used for resume:html) printed 5-6 roomy pages; this is plain
// text in one column (no tables, no images, contact info in the body) so parsers
// read it in order.
//   npm run resume:pdf   (or: node scripts/render_application_pdf.mjs [out.pdf])
import { readFile, writeFile } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const r = JSON.parse(await readFile('resume.json', 'utf8'));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ym = s => {
  if (!s) return 'Present';
  const [y, m] = s.split('-');
  return m ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m - 1]} ${y}` : y;
};
const ul = items => items?.length ? `<ul>${items.map(h => `<li>${esc(h)}</li>`).join('')}</ul>` : '';
const b = r.basics;
const host = u => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const contact = [b.location && `${b.location.city}, ${b.location.region}`, b.email, host(b.url),
  ...(b.profiles ?? []).map(p => host(p.url))].filter(Boolean).map(esc).join(' &middot; ');

const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(b.name)} - Resume</title><style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; line-height: 1.32; color: #111; margin: 0; }
  h1 { font-size: 18pt; margin: 0; }
  .label { font-size: 11pt; margin: 2px 0 4px; }
  .contact { font-size: 9pt; color: #333; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1px solid #999; margin: 12px 0 5px; padding-bottom: 2px; }
  .row { display: block; margin-top: 6px; }
  .role { font-weight: bold; }
  .when { float: right; font-weight: normal; color: #333; }
  .org { font-style: italic; }
  p { margin: 2px 0; }
  ul { margin: 2px 0 0 0; padding-left: 16px; }
  li { margin: 1px 0; }
  .skills p { margin: 2px 0; }
  li, .row { break-inside: avoid; }
  h2 { break-after: avoid; }
</style></head><body>
<h1>${esc(b.name)}</h1>
<div class="label">${esc(b.label)}</div>
<div class="contact">${contact}</div>

<h2>Summary</h2>
${b.summary.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('')}

<h2>Experience</h2>
${r.work.map(w => `<div class="row"><span class="role">${esc(w.position)}</span>, <span class="org">${esc(w.name)}</span><span class="when">${ym(w.startDate)} &ndash; ${ym(w.endDate)}</span>
  ${w.summary ? `<p>${esc(w.summary)}</p>` : ''}${ul(w.highlights)}</div>`).join('')}

<h2>Projects</h2>
${r.projects.map(p => `<div class="row"><span class="role">${esc(p.name)}</span>${p.url ? ` &middot; ${esc(host(p.url))}` : ''}
  ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}${ul(p.highlights)}</div>`).join('')}

<h2>Skills</h2>
<div class="skills">${r.skills.map(s => `<p><b>${esc(s.name)}:</b> ${s.keywords.map(esc).join(', ')}</p>`).join('')}</div>

<h2>Education</h2>
${r.education.map(e => `<p><b>${esc(e.studyType)} ${esc(e.area)}</b>, ${esc(e.institution)}${e.honors ? `, ${esc(e.honors)}` : ''} (${ym(e.endDate)})</p>`).join('')}

${r.publications?.length ? `<h2>Writing</h2>${r.publications.map(p => `<p>${esc(p.name)} &middot; ${esc(host(p.url))} (${ym(p.releaseDate)})</p>`).join('')}` : ''}
</body></html>`;

const out = process.argv[2] ?? 'Konrad-Odell-Resume.pdf';
const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0' });
await writeFile(out, await page.pdf({ format: 'Letter', margin: { top: '0.5in', bottom: '0.5in', left: '0.6in', right: '0.6in' } }));
await browser.close();
console.log(`wrote ${out}`);
