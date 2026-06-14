// Tiny spintax expander: {a|b|c} → random choice. Nested braces supported.
export function spin(template: string): string {
  let s = template;
  // iteratively resolve innermost {a|b|...} groups
  // safety cap to avoid infinite loops
  for (let i = 0; i < 50; i++) {
    const m = s.match(/\{([^{}]+)\}/);
    if (!m) break;
    const opts = m[1].split("|");
    const pick = opts[Math.floor(Math.random() * opts.length)];
    s = s.slice(0, m.index!) + pick + s.slice(m.index! + m[0].length);
  }
  return s;
}

export function spinMany(template: string, n: number): string[] {
  return Array.from({ length: n }, () => spin(template));
}
