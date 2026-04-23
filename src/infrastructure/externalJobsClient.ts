import "dotenv/config";
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
    const url = this.url("/api/tasks");
    let res: Response;
    try {
      res = await fetch(url, { method: "GET" });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "unknown error";
      throw new Error(`jobs-service is unreachable: ${url} (${reason})`);
    }
    if (res.status == 404) return [];
    if (!res.ok) {
      throw new Error(`jobs-service returned ${res.status} for ${url}`);
    }
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      if (Array.isArray(o.items)) return o.items as JobsRawItem[];
      if (Array.isArray(o.tasks)) return o.tasks as JobsRawItem[];
      if (Array.isArray(o.data)) return o.data as JobsRawItem[];
    }
    return [];
  }

  /** Отфильтрованный список задач (те же поля, что и у `/api/tasks`, включая `technologies`). */
  async listFilteredTasks(): Promise<JobsRawItem[]> {
    const url = this.url("/api/tasks/filtered");
    let res: Response;
    try {
      res = await fetch(url, { method: "GET" });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : "unknown error";
      throw new Error(`jobs-service is unreachable: ${url} (${reason})`);
    }
    if (!res.ok) {
      throw new Error(`jobs-service returned ${res.status} for ${url}`);
    }
    const data: unknown = await res.json();
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      const o = data as Record<string, unknown>;
      if (Array.isArray(o.items)) return o.items as JobsRawItem[];
      if (Array.isArray(o.tasks)) return o.tasks as JobsRawItem[];
      if (Array.isArray(o.data)) return o.data as JobsRawItem[];
    }
    return [];
  }
}

export function createJobsClient(): HttpJobsClient | null {
  const raw =
    process.env.JOBS_SERVICE_BASE_URL?.trim() ||
    process.env.JOBS_SERVICE_BASE_URL2?.trim();
  if (!raw) return null;
  return new HttpJobsClient(raw);
}
