import { appConfig } from "./config";
import { authorizedFetch } from "./sheetsClient";
import type { GoogleUserProfile } from "../types";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

const GOOGLE_SCRIPT_ID = "google-identity-script";

export async function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.oauth2) {
    return;
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await waitForGoogleIdentityServices();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google auth script."));
    document.head.append(script);
  });

  await waitForGoogleIdentityServices();
}

async function waitForGoogleIdentityServices(): Promise<void> {
  const startedAt = Date.now();
  while (!window.google?.accounts.oauth2) {
    if (Date.now() - startedAt > 8000) {
      throw new Error("Google sign-in script is taking too long to load.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
}

export function getGoogleTokenClient(
  callback: (response: { access_token?: string; error?: string }) => void
): GoogleTokenClient {
  if (!window.google?.accounts.oauth2) {
    throw new Error("Google Identity Services is not loaded yet.");
  }

  return window.google.accounts.oauth2.initTokenClient({
    client_id: appConfig.googleClientId,
    scope:
      "openid email profile https://www.googleapis.com/auth/spreadsheets",
    callback,
  });
}

export function revokeGoogleToken(token: string): void {
  window.google?.accounts.oauth2.revoke(token);
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await authorizedFetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    accessToken,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = (await response.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  return {
    id: data.id ?? "",
    email: data.email ?? "",
    name: data.name ?? "",
    picture: data.picture ?? "",
  };
}
