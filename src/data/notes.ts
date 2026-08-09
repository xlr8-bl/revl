import type { NoteUpload } from '../types';

/**
 * Mock uploaded notes — this material is what grounds the AI
 * (the NotebookLM-style "bridge to your notes" layer).
 */
export const noteUploads: NoteUpload[] = [
  {
    id: 'n1',
    courseCode: 'CEC420',
    fileName: 'Data Mining. Lecture notes.pdf',
    kind: 'pdf',
    pages: 42,
    uploadedAt: Date.parse('2026-05-30'),
    indexed: true,
  },
  {
    id: 'n2',
    courseCode: 'CEC420',
    fileName: 'Entropy worked examples (photo).jpg',
    kind: 'image',
    uploadedAt: Date.parse('2026-06-08'),
    indexed: true,
  },
  {
    id: 'n3',
    courseCode: 'CEC412',
    fileName: 'ML summary sheet.pdf',
    kind: 'pdf',
    pages: 6,
    uploadedAt: Date.parse('2026-06-15'),
    indexed: false, // still processing in the (future) pipeline
  },
];
