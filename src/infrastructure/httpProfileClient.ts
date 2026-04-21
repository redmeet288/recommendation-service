import "dotenv/config";
export type ProfileRaw = unknown;

/**
 * profile-service client.
 * Только HTTP: `GET {baseUrl}/profiles/me` с заголовком `X-User-Id`.
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

  async getMe(xUserId: string): Promise<ProfileRaw | null> {
    const base = this.base();
    const url = `${base}/profiles/me`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          "X-User-Id": xUserId.trim(),
        },
      });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "unknown error";
      throw new Error(
        `profile-service is unreachable: ${url} (${reason})`,
      );
    }

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(
        `profile-service returned ${res.status} for ${url}`,
      );
    }
    return (await res.json()) as unknown;
  }
}

export function createProfileClient(): HttpProfileClient | null {
  const raw = process.env.PROFILE_SERVICE_BASE_URL?.trim();
  if (!raw) return null;
  return new HttpProfileClient(raw);
}
