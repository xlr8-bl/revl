/**
 * Revl core domain types.
 *
 * Everything here is designed so the real backend/AI drops in later
 * without UI changes — screens render from these shapes via /data mocks.
 */

/* ------------------------------------------------------------------ */
/* Papers — structured JSON, never PDFs. Rendered natively.            */
/* ------------------------------------------------------------------ */

export type Paper = {
  id: string;
  courseCode: string; // "CEC420"
  title: string; // "Data Mining"
  year: number;
  session: string; // "First Semester Exam"
  semester: string; // "Semester 1"
  faculty: string;
  department: string;
  level: string; // "L400"
  duration: string; // "3 hours"
  totalMarks: number;
  instructions: string;
  questions: Question[];
};

export type Question = {
  id: string;
  number: string; // "1", "2a", "3(c)(ii)"
  /** Markdown + LaTeX ($...$ inline math) — rendered by MathRichText. */
  text: string;
  marks: number;
  /** Topic tags — these power Study DNA. */
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  diagrams: Diagram[];
  /** Recursive: 2a, 2b, 2b-i… */
  subQuestions: Question[];
  answers: {
    /** AI worked solution (general knowledge). Shows a subtle "AI" tag. */
    aiGeneral?: string;
    /** Community/TA-verified solution. Shows the ✓ verified badge. */
    verified?: string;
    references?: Ref[];
  };
  /** When present, the question is multiple-choice: the options render as
   * tappable rows and "Check" marks the correct one (still logs one
   * RevealLog row, resolution from correctness). */
  options?: { label: string; correct: boolean }[];
};

export type Diagram = {
  id: string;
  imageUrl: string;
  caption?: string;
  /** Crop bounding box from the extraction pipeline (optional). */
  bbox?: number[];
};

export type Ref = {
  source: 'notes' | 'textbook';
  label: string; // "Your notes, p.14"
  location: string; // deep-link/location string for the notes viewer
};

/* ------------------------------------------------------------------ */
/* Courses / catalogue                                                 */
/* ------------------------------------------------------------------ */

export type Course = {
  code: string; // "CEC420"
  title: string;
  faculty: string;
  department: string;
  level: string;
  paperIds: string[];
  rating: number; // 0–5
  /** Tile / thumbnail gradient (we use gradients instead of remote art). */
  gradient: [string, string];
};

export type Faculty = {
  id: string;
  name: string; // "ENGINEERING"
  color: string; // bright tile color, reference-style
};

/* ------------------------------------------------------------------ */
/* Study DNA — one tally table, everything derived from it.            */
/* ------------------------------------------------------------------ */

/** One row written every time a student reveals/self-assesses a question. */
export type RevealLog = {
  id: string;
  questionId: string;
  courseCode: string;
  tags: string[]; // the question's topics
  confidenceBefore: 'yes' | 'sort-of' | 'no';
  resolution: 'got-it' | 'not-yet';
  /** Prerequisite tags returned by the AI tail — logged lighter-weight. */
  prerequisiteTags?: string[];
  /** Did we have uploaded notes to ground the answer? */
  hadNotes: boolean;
  timestamp: number;
};

export type TopicStat = {
  tag: string;
  seen: number;
  notYet: number;
  gotIt: number;
  /** confidenceBefore === "yes" but resolution === "not-yet". */
  falseConfidence: number;
  /** 0 (mastered) → 1 (weakest). Drives the constellation darkness. */
  weakness: number;
  lastSeen: number;
};

export type PrerequisiteEdge = {
  /** The struggling topic. */
  from: string;
  /** The prerequisite it traces back to. */
  to: string;
  count: number;
};

/* ------------------------------------------------------------------ */
/* AI — NotebookLM-style layered explanation                           */
/* ------------------------------------------------------------------ */

export type ExplainResponse = {
  /** Layer 1 — the direct worked answer. */
  answer: string;
  /** Layer 2 — the surrounding concept ("this tests X because…"). */
  why: string;
  /**
   * Layer 3 — the bridge to the student's own notes. Absent when the
   * student has no notes / nothing relevant — the UI skips it silently.
   */
  notesBridge?: {
    text: string;
    reference: Ref;
  };
  /** Structured tail: 2–3 prerequisite topic tags this question depends on. */
  prerequisiteTags: string[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

/* ------------------------------------------------------------------ */
/* Notes upload (grounds the AI)                                       */
/* ------------------------------------------------------------------ */

export type NoteUpload = {
  id: string;
  courseCode: string;
  fileName: string;
  kind: 'pdf' | 'image' | 'text';
  pages?: number;
  uploadedAt: number;
  /** Set once the (future) pipeline has chunked + embedded the file. */
  indexed: boolean;
};

/* ------------------------------------------------------------------ */
/* Credits / economy                                                   */
/* ------------------------------------------------------------------ */

export type LedgerEntry = {
  id: string;
  amount: number; // + earned, − spent
  reason: string; // "Uploaded CEC412 2022 paper"
  timestamp: number;
};

export type User = {
  id: string;
  name: string;
  initial: string;
  credits: number; // the ⚡ number on Home
  notifications: number;
  enrolledCourseCodes: string[];
};

/* ------------------------------------------------------------------ */
/* Wrapped                                                             */
/* ------------------------------------------------------------------ */

export type WrappedStats = {
  papersConquered: number;
  questionsRevealed: number;
  nemesis: { questionNumber: string; courseCode: string; excerpt: string; beaten: boolean; notYetCount: number };
  turnaround: { topic: string; septemberWeakness: number; nowWeakness: number };
  prerequisiteStory: { struggled: string; tracedTo: string; clickedWeek: number; unlockedTopics: string[] };
  hoursStudied: number;
  mostActiveHour: string; // "11 PM"
  falseConfidenceStart: number;
  falseConfidenceEnd: number;
  predictedAccuracy?: number; // only if predicted-paper feature is on
};

/* ------------------------------------------------------------------ */
/* App config                                                          */
/* ------------------------------------------------------------------ */

export type AppConfig = {
  /** ISO date the semester ends — Wrapped gates off this. */
  semesterEndDate: string;
  /** Days around semesterEndDate that Wrapped stays visible. */
  wrappedWindowDays: number;
  predictedPaperEnabled: boolean;
};
