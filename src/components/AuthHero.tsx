import type { TFunction } from "../types";

interface AuthHeroProps {
  isAuthenticated: boolean;
  isAuthReady: boolean;
  userName?: string;
  userEmail?: string;
  userPicture?: string;
  t: TFunction;
  onLogin: () => void;
  onLogout: () => void;
}

export function AuthHero({
  isAuthenticated,
  isAuthReady,
  userName,
  userEmail,
  userPicture,
  t,
  onLogin,
  onLogout,
}: AuthHeroProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{t("hero.eyebrow")}</p>
        <p className="hero-copy">{t("hero.copy")}</p>
      </div>
      <div className="hero-actions">
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
