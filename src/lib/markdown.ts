/** Tiny renderer for our own dossier markdown (headings, bold/italic, nested lists). */
export function mdToHtml(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');

  const out: string[] = [];
  let listDepth = 0;
  const closeLists = (to: number) => {
    while (listDepth > to) {
      out.push('</ul>');
      listDepth--;
    }
  };

  for (const raw of md.split('\n')) {
    const h = raw.match(/^(#{1,3}) (.*)$/);
    const li = raw.match(/^(\s*)- (.*)$/);
    if (h) {
      closeLists(0);
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
    } else if (li) {
      const depth = Math.floor(li[1].length / 2) + 1;
      while (listDepth < depth) {
        out.push('<ul>');
        listDepth++;
      }
      closeLists(depth);
      out.push(`<li>${inline(li[2])}</li>`);
    } else if (raw.trim() === '') {
      closeLists(0);
    } else {
      closeLists(0);
      out.push(`<p>${inline(raw)}</p>`);
    }
  }
  closeLists(0);
  return out.join('\n');
}
