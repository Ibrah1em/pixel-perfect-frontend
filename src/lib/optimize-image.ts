export async function optimizeQuestionImage(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) throw new Error('اختر صورة JPG أو PNG أو WebP بحجم أقل من ٢٠ ميجابايت');
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر تجهيز الصورة');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('تعذر تجهيز الصورة')), 'image/webp', 0.88));
    if (blob.size > 2 * 1024 * 1024) throw new Error('الصورة كبيرة جدًا، اختر صورة أصغر');
    return new File([blob], 'question.webp', { type: 'image/webp' });
  } finally { image.close(); }
}