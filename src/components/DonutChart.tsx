export interface Segment {
  key: string;
  label: string;
  value: number; // absolute or share; normalized internally
  color: string;
}

interface Props {
  title: string;
  segments: Segment[];
  centerLabel?: string;
}

const R = 52;
const STROKE = 22;
const C = 2 * Math.PI * R;

/** Reusable SVG donut with a side legend. */
export function DonutChart({ title, segments, centerLabel }: Props) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  let offset = 0;

  return (
    <div className="donut">
      <h2>{title}</h2>
      <div className="donut-body">
        <svg viewBox="0 0 140 140" className="donut-svg" role="img" aria-label={title}>
          <g transform="translate(70,70) rotate(-90)">
            <circle r={R} fill="none" stroke="#242a33" strokeWidth={STROKE} />
            {total > 0 &&
              segments.map((s) => {
                const frac = Math.max(0, s.value) / total;
                if (frac <= 0) return null;
                const dash = frac * C;
                const seg = (
                  <circle
                    key={s.key}
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += dash;
                return seg;
              })}
          </g>
          {centerLabel && (
            <text x="70" y="74" textAnchor="middle" className="donut-center">
              {centerLabel}
            </text>
          )}
        </svg>
        <ul className="donut-legend">
          {segments
            .filter((s) => s.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((s) => (
              <li key={s.key}>
                <i className="swatch" style={{ background: s.color }} />
                <span className="dl-label">{s.label}</span>
                <span className="dl-val">{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
