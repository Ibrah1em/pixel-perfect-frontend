export function academyHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | أكاديمية الفيزياء` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} | أكاديمية الفيزياء` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}