import { useMemo, useState } from 'react';
import { mdToHtml } from '../lib/markdown';
import { useI18n } from '../i18n/I18nContext';

interface Props {
  markdown: string;
  year: number;
  onClose: () => void;
}

export function DossierModal({ markdown, year, onClose }: Props) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => mdToHtml(markdown), [markdown]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const onDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement-y${year}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-bar">
          <button className="mini" onClick={onCopy}>
            {copied ? t('actions.copied') : t('actions.copy')}
          </button>
          <button className="mini" onClick={onDownload}>
            {t('actions.download')}
          </button>
          <span className="modal-spacer" />
          <button className="mini" onClick={onClose}>
            {t('actions.close')}
          </button>
        </div>
        <div className="modal-body dossier-body" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
