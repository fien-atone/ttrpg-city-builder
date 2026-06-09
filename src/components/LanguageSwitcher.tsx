import { useI18n } from '../i18n/I18nContext';

export function LanguageSwitcher() {
  const { lang, setLang, langs, t } = useI18n();
  return (
    <div className="langswitch" role="group" aria-label="language">
      {langs.map((l) => (
        <button
          key={l}
          className={l === lang ? 'on' : ''}
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}
