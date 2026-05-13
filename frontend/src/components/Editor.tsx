"use client";

interface EditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  hint?: string;
}

export default function Editor({ label, value, onChange, placeholder, minHeight = "120px", hint }: EditorProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium opacity-70">{label}</label>
      )}
      <div className="relative">
        <textarea
          className="input-field resize-none leading-relaxed"
          style={{ minHeight }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {value.length > 0 && (
          <span className="absolute bottom-2 right-3 text-xs opacity-30">{value.length} chars</span>
        )}
      </div>
      {hint && <p className="text-xs opacity-40">{hint}</p>}
    </div>
  );
}
