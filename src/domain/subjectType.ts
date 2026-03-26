export const SubjectType = {
  JOB: "JOB",
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export function parseSubjectType(value: string | undefined): SubjectType | null {
  if (value === SubjectType.JOB) {
    return value;
  }
  return null;
}
