import { SubjectType } from "../domain/subjectType";
import { scoreStackOverlap } from "../domain/recommendationScoring";
import type { HttpJobsClient, JobsRawItem } from "../infrastructure/externalJobsClient";
import type { HttpProfileClient, ProfileRaw } from "../infrastructure/httpProfileClient";

type CursorPayload = { id: string };

function encodeCursor(payload: CursorPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64");
}

function decodeCursor(cursor: string): CursorPayload {
  try {
    const json = Buffer.from(cursor, "base64").toString("utf8");
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid cursor payload");
    }
    const p = parsed as Partial<CursorPayload>;
    if (typeof p.id !== "string" || !p.id) {
      throw new Error("Invalid cursor id");
    }
    return { id: p.id };
  } catch (e) {
    throw new Error("Invalid cursor");
  }
}

function extractCursorId(item: JobsRawItem): string | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;

  // Typical shapes we might get from upstream services.
  for (const key of ["id", "taskId", "jobId", "uuid", "_id", "key"]) {
    const v = o[key];
    if (typeof v === "string" && v) return v;
    if (typeof v === "number") return String(v);
  }
  return null;
}

function extractStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  return [];
}

function extractValuesArray(value: unknown): string[] {
  // Ожидаем OData-like структуру: { $id, $values: [ ... ] }
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (Array.isArray(v.$values)) {
      return extractStringArray(v.$values);
    }
  }
  // иногда просто приходит массив/строка
  if (typeof value === "string") return [value];
  return extractStringArray(value);
}

function extractTechnologiesForScoring(raw: JobsRawItem): string[] {
  const o = raw as Record<string, unknown>;
  const tech = o.technologies ?? o.stack ?? o.skills ?? o.specialization;
  return extractValuesArray(tech);
}

function extractProfileStack(profile: ProfileRaw): string[] {
  if (profile && typeof profile === "object") {
    const o = profile as Record<string, unknown>;
    const stack = o.stack;
    return extractStringArray(stack);
  }
  return [];
}

export class GetRecommendationsForMe {
  constructor(
    private readonly profiles: HttpProfileClient | null,
    private readonly jobs: HttpJobsClient | null,
  ) {}

  async executeAll(
    xUserId: string,
    xRoles: string,
    subjectType: SubjectType,
  ): Promise<JobsRawItem[]> {
    if (!this.profiles) {
      throw new Error("не удалось найти профиль");
    }
    if (!this.jobs) {
      throw new Error("не удалось найти задачи");
    }

    const profile = await this.profiles.getMe(xUserId, xRoles);
    if (!profile) {
      throw new Error("не удалось найти профиль");
    }

    const profileStack = extractProfileStack(profile);

    if (subjectType !== SubjectType.JOB) {
      // EXECUTOR branch removed (upstream endpoint /executors/candidates is not available).
      throw new Error("subjectType must be JOB");
    }

    const jobs = await this.jobs.listOpenJobs();
    if (!jobs.length) {
      throw new Error("не удалось найти задачи");
    }

    const scored = jobs.map((job) => {
      const tags = extractTechnologiesForScoring(job);
      return {
        job,
        score: scoreStackOverlap(profileStack, tags).score,
      };
    });

    // Deterministic ordering: score desc, then id desc (when id exists).
    scored.sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      const aId = extractCursorId(a.job);
      const bId = extractCursorId(b.job);
      if (aId && bId) return bId.localeCompare(aId);
      if (aId) return -1;
      if (bId) return 1;
      return 0;
    });

    return scored.map((x) => x.job);
  }

  async executePaged(
    xUserId: string,
    xRoles: string,
    subjectType: SubjectType,
    xCursor: string | undefined,
  ): Promise<{ items: JobsRawItem[]; nextCursor: string | null; hasMore: boolean }> {
    if (!this.profiles) {
      throw new Error("не удалось найти профиль");
    }
    if (!this.jobs) {
      throw new Error("не удалось найти задачи");
    }

    const profile = await this.profiles.getMe(xUserId, xRoles);
    if (!profile) {
      throw new Error("не удалось найти профиль");
    }

    const profileStack = extractProfileStack(profile);

    if (subjectType !== SubjectType.JOB) {
      throw new Error("subjectType must be JOB");
    }

    const jobs = await this.jobs.listOpenJobs();
    if (!jobs.length) {
      throw new Error("не удалось найти задачи");
    }

    const pageSize = 1;

    const scored = jobs.map((job) => {
      const tags = extractTechnologiesForScoring(job);
      const cursorId = extractCursorId(job);
      return {
        job,
        cursorId,
        score: scoreStackOverlap(profileStack, tags).score,
      };
    });

    // Cursor pagination requires a stable unique key per item.
    if (scored.some((x) => !x.cursorId)) {
      throw new Error("Missing item id for cursor pagination");
    }

    // Deterministic ordering: score desc, then id desc.
    scored.sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      return b.cursorId!.localeCompare(a.cursorId!);
    });

    let startIndex = 0;
    if (xCursor && xCursor.trim()) {
      const decoded = decodeCursor(xCursor.trim());
      const idx = scored.findIndex((x) => x.cursorId === decoded.id);
      if (idx < 0) {
        throw new Error("Invalid cursor");
      }
      // Cursor encodes the last returned element id; next page starts after it.
      startIndex = idx + 1;
    }

    const page = scored.slice(startIndex, startIndex + pageSize);
    const items = page.map((x) => x.job);
    const hasMore = startIndex + pageSize < scored.length;
    const lastItem = items[items.length - 1];
    const nextCursor = hasMore && lastItem ? encodeCursor({ id: extractCursorId(lastItem)! }) : null;

    return { items, nextCursor, hasMore };
  }
}
