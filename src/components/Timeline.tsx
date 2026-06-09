interface Props {
  years: number;
  value: number;
  onChange: (year: number) => void;
}

export function Timeline({ years, value, onChange }: Props) {
  return (
    <div className="timeline">
      <input
        type="range"
        min={0}
        max={years}
        value={Math.min(value, years)}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="timeline"
      />
    </div>
  );
}
