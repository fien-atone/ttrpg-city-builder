import { useState, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  title: string;
  presetOptions?: { value: string; label: string }[];
  onPreset?: (id: string) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function DomainSection({ title, presetOptions, onPreset, defaultOpen = false, children }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="domain">
      <header className="domain-head">
        <button className="domain-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className={`caret ${open ? 'open' : ''}`}>▸</span>
          {title}
        </button>
        {presetOptions && onPreset && (
          <select
            className="preset-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onPreset(e.target.value);
              e.target.value = '';
            }}
            title={t('preset.label')}
          >
            <option value="">{t('preset.label')}…</option>
            {presetOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </header>
      {open && <div className="domain-body">{children}</div>}
    </section>
  );
}
