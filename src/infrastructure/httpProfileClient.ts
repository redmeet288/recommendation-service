export type ProfileRaw = unknown;

/**
 * profile-service client.
 * Только HTTP: `GET {baseUrl}/profiles/me` с заголовками `X-User-Id` / `X-Roles`.
 *
 * Сервис рекомендаций ничего не “вырезает” из ответа — мы используем его только для:
 * - `stack` (для скоринга)
 * - `userUuid` (если нужно, но сейчас можно доверять входному X-User-Id)
 */
export class HttpProfileClient {
  constructor(private readonly baseUrl: string) {}

  private base(): string {
    return this.baseUrl.replace(/\/$/, "");
  }

  async getMe(xUserId: string, xRoles: string): Promise<ProfileRaw | null> {
    const base = this.base();
    const url = base.toLowerCase().endsWith("/profiles")
      ? `${base}/me`
      : `${base}/profiles/me`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-User-Id": xUserId.trim(),
        "X-Roles": xRoles.trim(),
      },
    });

    if (res.status === 404) return null;
    // if (!res.ok) throw new Error("не удалось найти профиль");
    return (await res.json()) as unknown;
  }
}

export function createProfileClient(): HttpProfileClient | null {
  const raw = process.env.PROFILE_SERVICE_BASE_URL?.trim();
  if (!raw) return null;
  return new HttpProfileClient(raw);
}
