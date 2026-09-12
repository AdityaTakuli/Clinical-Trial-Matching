import { Fragment, ReactNode } from "react";

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "h"; text: string }
  | { type: "table"; rows: string[][] };

const INLINE =
  /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)<]+|\*[^*\s][^*\n]*\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;

  for (const match of text.matchAll(INLINE)) {
    const token = match[0];
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const key = `${keyPrefix}-${i++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{renderInline(token.slice(2, -2), key)}</strong>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("[")) {
      const [, label, href] = token.match(/^\[([^\]]+)\]\((.+)\)$/) ?? [];
      nodes.push(
        <a key={key} href={href} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    } else if (token.startsWith("http")) {
      const url = token.replace(/[.,;:!?]+$/, "");
      nodes.push(
        <a key={key} href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      );
      if (url.length < token.length) nodes.push(token.slice(url.length));
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    last = start + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;

  for (const raw of source.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();

    if (!line) {
      current = null;
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      blocks.push({ type: "h", text: heading[1] });
      current = null;
      continue;
    }

    if (/^\|.*\|$/.test(line)) {
      if (/^\|[\s:|-]+\|$/.test(line)) continue; // header separator row
      const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
      if (current?.type === "table") {
        current.rows.push(cells);
      } else {
        current = { type: "table", rows: [cells] };
        blocks.push(current);
      }
      continue;
    }

    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    const listType = bullet ? "ul" : ordered ? "ol" : null;

    if (listType) {
      const item = (bullet ?? ordered)![1];
      if (current?.type === listType) {
        current.items.push(item);
      } else {
        current = { type: listType, items: [item] };
        blocks.push(current);
      }
      continue;
    }

    // Indented continuation of the previous list item
    if ((current?.type === "ul" || current?.type === "ol") && /^\s{2,}/.test(raw)) {
      current.items[current.items.length - 1] += ` ${line}`;
      continue;
    }

    if (current?.type === "p") {
      current.lines.push(line);
    } else {
      current = { type: "p", lines: [line] };
      blocks.push(current);
    }
  }

  return blocks;
}

/** Minimal, safe Markdown renderer for assistant replies (no raw HTML). */
export default function Markdown({ content }: { content: string }) {
  return (
    <div className="chat-prose">
      {parseBlocks(content).map((block, b) => {
        const key = `b${b}`;
        switch (block.type) {
          case "h":
            return <h4 key={key}>{renderInline(block.text, key)}</h4>;
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List key={key}>
                {block.items.map((item, i) => (
                  <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
                ))}
              </List>
            );
          }
          case "table":
            return (
              <div key={key} className="my-2 overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="min-w-full text-xs">
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className={r === 0 ? "bg-[var(--surface-hover)] font-medium" : "border-t border-[var(--border)]"}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-2.5 py-1.5 align-top">
                            {renderInline(cell, `${key}-${r}-${c}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return (
              <p key={key}>
                {block.lines.map((line, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {renderInline(line, `${key}-${i}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
