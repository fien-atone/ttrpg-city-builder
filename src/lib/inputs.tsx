import type { ReactNode } from 'react';

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  display?: string;
  onChange: (v: number) => void;
}
export function RangeField({ label, value, min, max, step = 1, suffix, display, onChange }: RangeProps) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        <b>{display ?? `${value}${suffix ?? ''}`}</b>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface Option {
  value: string;
  label: string;
}
interface SelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
}
export function SelectField({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="field">
      {label && (
        <label>
          <span>{label}</span>
        </label>
      )}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface NumberProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}
export function NumberField({ label, value, min, max, step, onChange }: NumberProps) {
  return (
    <div className="field">
      {label && (
        <label>
          <span>{label}</span>
        </label>
      )}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}
export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="chk">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function InlineRow({ children }: { children: ReactNode }) {
  return <div className="inline-row">{children}</div>;
}
