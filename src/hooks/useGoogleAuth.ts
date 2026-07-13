import { useEffect, useRef, useState } from "react";
import {
  fetchGoogleUserProfile,
  getGoogleTokenClient,
  loadGoogleIdentityScript,
  revokeGoogleToken,
} from "../lib/googleAuth";
import { appConfig } from "../lib/config";
import type { GoogleUserProfile, LocaleCode } from "../types";
import type { TFunction } from "../types";

const STORAGE_KEY_ACCESS_TOKEN = "accountbook.accessToken";
const STORAGE_KEY_USER_PROFILE = "accountbook.userProfile";

interface UseGoogleAuthOptions {
  locale: LocaleCode;
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseGoogleAuthReturn {
  accessToken: string;
  isAuthReady: boolean;
  userProfile: GoogleUserProfile | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export function useGoogleAuth(options: UseGoogleAuthOptions): UseGoogleAuthReturn {
  const { locale, t, setToast } = options;
  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN) ?? "";
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  });
  const tokenClientRef = useRef<ReturnType<typeof getGoogleTokenClient> | null>(null);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, accessToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
    }
  }, [accessToken]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_PROFILE);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!appConfig.googleClientId) {
      setToast(t("toast.setClientId"));
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled) {
          return;
        }
        tokenClientRef.current = getGoogleTokenClient((response) => {
          if (response.error) {
            setToast(`${t("toast.signInFailed")}: ${response.error}`);
            return;
          }
          if (!response.access_token) {
            setToast(t("toast.noAccessToken"));
            return;
          }
          setAccessToken(response.access_token);
          void fetchGoogleUserProfile(response.access_token)
            .then((profile) => setUserProfile(profile))
            .catch(() => {
              setUserProfile(null);
            });
        });
        setIsAuthReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : t("toast.authLoadFailed");
        setToast(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale, t, setToast]);

  function login(): void {
    if (!isAuthReady || !tokenClientRef.current) {
      setToast(t("toast.authNotReady"));
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }

  function logout(): void {
    if (accessToken) {
      revokeGoogleToken(accessToken);
    }
    setAccessToken("");
    setUserProfile(null);
  }

  return {
    accessToken,
    isAuthReady,
    userProfile,
    isAuthenticated: !!accessToken,
    login,
    logout,
  };
}
