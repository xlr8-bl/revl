import type { Course, Faculty } from '../types';

/**
 * Faculties — the bright colored tiles on the Courses screen
 * (reference: LOVE / HEALING / ANXIETY tiles).
 */
export const faculties: Faculty[] = [
  { id: 'f1', name: 'ENGINEERING', color: '#9D2450' },
  { id: 'f2', name: 'MEDICINE', color: '#E04B2F' },
  { id: 'f3', name: 'LAW', color: '#4A3D63' },
  { id: 'f4', name: 'SCIENCE', color: '#3C6FE8' },
  { id: 'f5', name: 'ECONOMICS', color: '#357F84' },
  { id: 'f6', name: 'ARTS', color: '#4D6FB5' },
  { id: 'f7', name: 'EDUCATION', color: '#8A6D2F' },
  { id: 'f8', name: 'AGRICULTURE', color: '#3E7A44' },
];

/** Catalogue of courses. Thumbnails are gradients (no remote art needed). */
export const courses: Course[] = [
  {
    code: 'CEC420',
    title: 'Data Mining',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    paperIds: ['cec420-2023', 'cec420-2022', 'cec420-2021'],
    rating: 4.8,
    gradient: ['#1F3A5F', '#0E1626'],
  },
  {
    code: 'CEC412',
    title: 'Machine Learning',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    paperIds: ['cec412-2023', 'cec412-2022'],
    rating: 4.6,
    gradient: ['#4A2A5F', '#160E26'],
  },
  {
    code: 'CEC406',
    title: 'Computer Networks',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    paperIds: ['cec406-2023'],
    rating: 4.3,
    gradient: ['#1F5F4A', '#0E2616'],
  },
  {
    code: 'CEC404',
    title: 'Embedded Systems',
    faculty: 'Engineering',
    department: 'Computer Engineering',
    level: 'L400',
    paperIds: ['cec404-2023'],
    rating: 4.1,
    gradient: ['#5F3A1F', '#26160E'],
  },
  {
    code: 'MED310',
    title: 'Pathophysiology',
    faculty: 'Medicine',
    department: 'Biomedical Sciences',
    level: 'L300',
    paperIds: ['med310-2023'],
    rating: 4.7,
    gradient: ['#5F1F2E', '#260E13'],
  },
  {
    code: 'LAW205',
    title: 'Constitutional Law',
    faculty: 'Law',
    department: 'Public Law',
    level: 'L200',
    paperIds: ['law205-2023'],
    rating: 4.4,
    gradient: ['#3A3A5F', '#14142A'],
  },
];

/** Featured carousel at the top of the Courses screen. */
export const featuredCourses: {
  id: string;
  title: string;
  subtitle: string;
  courseCode: string;
  gradient: [string, string];
  badge: string;
}[] = [
  {
    id: 'feat1',
    title: 'DATA MINING',
    subtitle: 'CEC420 · Complete past-paper set · 2018–2023',
    courseCode: 'CEC420',
    gradient: ['#22314E', '#0A0F1A'],
    badge: 'FEATURED SET',
  },
  {
    id: 'feat2',
    title: 'MACHINE LEARNING',
    subtitle: 'CEC412 · Exam-season sprint · 5 papers',
    courseCode: 'CEC412',
    gradient: ['#3D2A52', '#120A1C'],
    badge: 'EXAM SEASON',
  },
  {
    id: 'feat3',
    title: 'PATHOPHYSIOLOGY',
    subtitle: 'MED310 · Most-revised this week',
    courseCode: 'MED310',
    gradient: ['#4E2231', '#1A0A10'],
    badge: 'TRENDING',
  },
];

/** Secondary outline filter chips (reference: New / Relationships / Listen & Watch). */
export const browseChips = ['New', 'Popular', 'Exam Season', 'Verified Answers', 'Free'];
