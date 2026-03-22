export type CommunityLessonDifficulty = "beginner" | "intermediate" | "advanced";
export type CommunityExerciseType =
  | "multiple-choice"
  | "matching"
  | "fill-blank"
  | "speech-to-text"
  | "translate-written";

export interface CommunityWord {
  id: string;
  term: string;
  translation: string;
  example?: string | null;
  note?: string | null;
}

export interface CommunityExercisePair {
  id: string;
  left: string;
  right: string;
}

export interface CommunityExercise {
  id: string;
  type: CommunityExerciseType;
  prompt: string;
  instructions?: string | null;
  options?: string[];
  correctAnswers?: string[];
  pairs?: CommunityExercisePair[];
  voiceText?: string | null;
  sourceText?: string | null;
  hint?: string | null;
  explanation?: string | null;
}

export interface CommunityAuthor {
  id: string;
  name: string;
}

export interface CommunityLessonSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CommunityLessonDifficulty;
  sourceLanguage: string;
  targetLanguage: string;
  icon: string;
  tags: string[];
  objectives: string[];
  estimatedMinutes: number;
  playCount: number;
  isPublished: boolean;
  wordCount: number;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  author: CommunityAuthor;
}

export interface CommunityLessonDetail extends CommunityLessonSummary {
  words: CommunityWord[];
  exercises: CommunityExercise[];
}

export interface CommunityLessonPayload {
  title: string;
  description: string;
  category: string;
  difficulty: CommunityLessonDifficulty;
  sourceLanguage: string;
  targetLanguage: string;
  icon: string;
  tags: string[];
  objectives: string[];
  words: CommunityWord[];
  exercises: CommunityExercise[];
  estimatedMinutes: number;
  isPublished: boolean;
}

export function createEmptyWord(): CommunityWord {
  return {
    id: crypto.randomUUID(),
    term: "",
    translation: "",
    example: "",
    note: "",
  };
}

export function createEmptyExercise(type: CommunityExerciseType): CommunityExercise {
  const base: CommunityExercise = {
    id: crypto.randomUUID(),
    type,
    prompt: "",
    instructions: "",
    options: [],
    correctAnswers: [],
    pairs: [],
    voiceText: "",
    sourceText: "",
    hint: "",
    explanation: "",
  };

  if (type === "multiple-choice") {
    return {
      ...base,
      options: ["", "", "", ""],
      correctAnswers: [""],
    };
  }

  if (type === "matching") {
    return {
      ...base,
      pairs: [
        { id: crypto.randomUUID(), left: "", right: "" },
        { id: crypto.randomUUID(), left: "", right: "" },
      ],
    };
  }

  return base;
}

export function splitListInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function matchesAcceptedAnswer(input: string, acceptedAnswers: string[] = []): boolean {
  const normalizedInput = normalizeAnswer(input);
  return acceptedAnswers.some((answer) => normalizeAnswer(answer) === normalizedInput);
}

export function shuffleArray<T>(items: T[]): T[] {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}

export function formatExerciseType(type: CommunityExerciseType): string {
  if (type === "multiple-choice") return "Coktan Secmeli";
  if (type === "matching") return "Eslestirme";
  if (type === "fill-blank") return "Bosluk Doldurma";
  if (type === "speech-to-text") return "Sesten Yaziya";
  return "Yazili Ceviri";
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
