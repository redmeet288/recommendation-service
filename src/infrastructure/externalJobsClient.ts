export type JobsRawItem = unknown;

/**
 * jobs-service client.
 * Ничего не “мэпим” — возвращаем исходный JSON-массив как есть,
 * потому что фронту нужны все поля.
 */
export class HttpJobsClient {
  constructor(private readonly baseUrl: string) {}

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async listOpenJobs(): Promise<JobsRawItem[]> {
    const res = await fetch(this.url("/api/tasks"), { method: "GET" });
    if (!res.ok) throw new Error("не удалось найти задачи");
    const data: unknown = await res.json();
    return Array.isArray(data) ? data : [];
  }
}

export function createJobsClient(): HttpJobsClient | null {
  const raw = process.env.JOBS_SERVICE_BASE_URL?.trim();
  if (!raw) return null;
  return new HttpJobsClient(raw);
}
