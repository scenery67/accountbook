import type { LocaleCode, TFunction } from "../types";

interface AuthHeroProps {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  currentLocale: LocaleCode;
  t: TFunction;
  onLocaleChange: (locale: LocaleCode) => void;
  extraActions?: React.ReactNode;
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthHero({
  isAuthenticated,
  isAuthReady,
  userName,
  userEmail,
  userPicture,
  currentLocale,
  t,
  onLocaleChange,
  extraActions,
  onLogin,
  onLogout,
}: AuthHeroProps) {
  const languageOptions = [
    { value: "ko" as const, label: t("lang.ko") },
    { value: "en" as const, label: t("lang.en") },
  ];

  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <p className="hero-copy">{t("hero.copy")}</p>
      </div>
      <div className="hero-actions">
        {extraActions}
        <label className="language-select">
          <span className="field-label">{t("lang.label")}</span>
          <select value={currentLocale} onChange={(event) => onLocaleChange(event.target.value as LocaleCode)}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {!isAuthenticated ? (
          <button className="primary-button" onClick={onLogin} disabled={!isAuthReady}>
            {isAuthReady ? t("auth.signIn") : t("auth.loading")}
          </button>
        ) : (
          <>
            <div className="user-chip">
              {userPicture ? <img className="user-avatar" src={userPicture} alt={userName ?? userEmail ?? "user"} /> : null}
              <div className="user-meta">
                <span className="user-label">{t("auth.signedInAs")}</span>
                <strong>{userName || userEmail}</strong>
                {userName && userEmail ? <span>{userEmail}</span> : null}
              </div>
            </div>
            <button className="ghost-button" onClick={onLogout}>
              {t("auth.signOut")}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
