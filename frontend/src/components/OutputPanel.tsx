"use client";

import { copyToClipboard } from "@/utils";
import { useState } from "react";

interface OutputPanelProps {
  title: string;
  children: React.ReactNode;
  onCopy?: () => string;
  loading?: boolean;
}

export default function OutputPanel({ title, children, onCopy, loading }: OutputPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      copyToClipboard(onCopy());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
          <span className="w-1.5 h-5 bg-primary rounded-full inline-block" />
          {title}
        </h3>
        {onCopy && !loading && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs btn-secondary px-3 py-1.5 rounded-lg"
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
            <button
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([onCopy()], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = `${title.toLowerCase().replace(/\s+/g, '_')}_export.txt`;
                document.body.appendChild(element);
                element.click();
              }}
              className="text-xs btn-primary px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <span>📄</span> Export
            </button>
          </div>
        )}
      </div>

      {/* Panel Body */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm">AI is generating your output...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">{children}</div>
      )}
    </div>
  );
}

// Reusable section inside OutputPanel
export function OutputSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wider opacity-50 mb-2">{label}</h4>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function OutputList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-primary mt-0.5 shrink-0">›</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function RAGCitations({ citations }: { citations: Array<{title?: string, authors?: string, similarity?: number}> }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
        <span>📚</span> Grounded In Literature
      </h4>
      <div className="space-y-3">
        {citations.map((cite, i) => (
          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              {cite.title || "Unknown Title"}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">{cite.authors || "Unknown Authors"}</p>
              {cite.similarity && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {Math.round(cite.similarity * 100)}% Match
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
