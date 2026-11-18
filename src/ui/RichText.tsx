import type { ReactNode } from 'react';

/**
 * Renders simple plain text: blank lines split paragraphs, lines starting with
 * "- " become bullets and "1. " numbered steps. No HTML is ever injected.
 */
export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, '').split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (/^\s*[-•*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-•*]\s+/, ''));
      blocks.push(<ul key={i}>{items.map((t, k) => <li key={k}>{t}</li>)}</ul>);
    } else if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      blocks.push(<ol key={i}>{items.map((t, k) => <li key={k}>{t}</li>)}</ol>);
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^\s*([-•*]|\d+[.)])\s+/.test(lines[i])) para.push(lines[i++]);
      blocks.push(<p key={i}>{para.join('\n')}</p>);
    }
  }
  return <div className="rich">{blocks}</div>;
}
