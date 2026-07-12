interface AuthHeroProps {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  currentLocale: "ko" | "en";
  languageLabel: string;
  languageOptions: Array<{ value: "ko" | "en"; label: string }>;
  onLocaleChange: (locale: "ko" | "en") => void;
  title: string;
  eyebrow: string;
  copy: string;
  signInLabel: string;
  signOutLabel: string;
  authLoadingLabel: string;
  signedInAsLabel: string;
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
  languageLabel,
  languageOptions,
  onLocaleChange,
  title,
  eyebrow,
  copy,
  signInLabel,
  signOutLabel,
  authLoadingLabel,
  signedInAsLabel,
  extraActions,
  onLogin,
  onLogout,
}: AuthHeroProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{copy}</p>
      </div>
      <div className="hero-actions">
        {extraActions}
        <label className="language-select">
          <span className="field-label">{languageLabel}</span>
          <select value={currentLocale} onChange={(event) => onLocaleChange(event.target.value as "ko" | "en")}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {!isAuthenticated ? (
          <button className="primary-button" onClick={onLogin} disabled={!isAuthReady}>
            {isAuthReady ? signInLabel : authLoadingLabel}
          </button>
        ) : (
          <>
            <div className="user-chip">
              {userPicture ? <img className="user-avatar" src={userPicture} alt={userName ?? userEmail ?? "user"} /> : null}
              <div className="user-meta">
                <span className="user-label">{signedInAsLabel}</span>
                <strong>{userName || userEmail}</strong>
                {userName && userEmail ? <span>{userEmail}</span> : null}
              </div>
            </div>
            <button className="ghost-button" onClick={onLogout}>
              {signOutLabel}
            </button>
          </>
        )}
      </div>
    </header>
  );
}
