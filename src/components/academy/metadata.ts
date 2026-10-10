export function academyHead(title: string, description: string) {
  return { meta: [
    { title: `${title} | physics` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} | physics` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}