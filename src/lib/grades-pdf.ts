// Paginate whole rows before capture to preserve Arabic shaping and repeat headings.
export async function downloadGradesPdf(root: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14, contentW = 210 - margin * 2, contentH = 297 - margin * 2 - 10;
  await document.fonts.ready;
  const header = root.querySelector<HTMLElement>('.grades-report-head');
  if (!header) throw new Error('Missing report heading');
  const page = root.cloneNode(false) as HTMLElement;
  page.removeAttribute('id');
  document.body.appendChild(page);
  let pageCount = 0;
  async function capturePage() {
    const canvas = await html2canvas(page, { scale: 2, backgroundColor: getComputedStyle(page).backgroundColor });
    const height = canvas.height / canvas.width * contentW;
    if (height > contentH + 0.5) throw new Error('Report row exceeds page height');
    if (pageCount > 0) pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentW, height);
    pageCount++;
  }
  try {
    const maxHeight = contentH / contentW * page.getBoundingClientRect().width;
    for (const section of root.querySelectorAll<HTMLElement>('.grades-report-class')) {
      const classPage = section.cloneNode(true) as HTMLElement;
      const body = classPage.querySelector('tbody');
      if (!body) continue;
      const rows = Array.from(body.children);
      body.replaceChildren();
      page.replaceChildren(header.cloneNode(true), classPage);
      for (const row of rows) {
        body.appendChild(row);
        if (page.getBoundingClientRect().height > maxHeight && body.children.length > 1) {
          body.removeChild(row);
          await capturePage();
          body.replaceChildren(row);
        }
      }
      await capturePage();
    }
    if (!pageCount) { page.replaceChildren(header.cloneNode(true)); await capturePage(); }
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.text(`${i} / ${pageCount}`, 105, 285, { align: 'center' });
    }
    pdf.save(filename);
  } finally {
    page.remove();
  }
}
