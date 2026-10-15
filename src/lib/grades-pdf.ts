// Renders each class section of the hidden report to an image (keeps Arabic shaping intact) and packs them into A4 pages.
export async function downloadGradesPdf(root: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas-pro'), import('jspdf')]);
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210, pageH = 297, margin = 10, contentW = pageW - margin * 2;
  let y = margin, first = true;
  for (const section of Array.from(root.querySelectorAll<HTMLElement>('[data-pdf-block]'))) {
    const canvas = await html2canvas(section, { scale: 2, backgroundColor: '#ffffff' });
    const pxPerMm = canvas.width / contentW;
    let offset = 0;
    while (offset < canvas.height) {
      const room = pageH - margin - y;
      const remaining = (canvas.height - offset) / pxPerMm;
      if (remaining > room && room < 40 && !first) { pdf.addPage(); y = margin; continue; }
      const sliceMm = Math.min(remaining, pageH - margin - y);
      const slicePx = Math.round(sliceMm * pxPerMm);
      const part = document.createElement('canvas');
      part.width = canvas.width; part.height = slicePx;
      part.getContext('2d')!.drawImage(canvas, 0, offset, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
      pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', margin, y, contentW, sliceMm);
      offset += slicePx; y += sliceMm + 6; first = false;
      if (offset < canvas.height) { pdf.addPage(); y = margin; }
    }
  }
  pdf.save(filename);
}
