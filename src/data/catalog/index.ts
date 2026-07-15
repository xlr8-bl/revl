/**
 * Catalogue selectors — the single API the onboarding wizard and the
 * Courses screen use. Data files are generated from official sources
 * (see headers in ub.ts / hnd.ts).
 */
import { hndCourses, hndDepartments, hndFaculties, hndGeneralCourses } from './hnd';
import type { CatalogCourse, Department, Faculty, School, SchoolId } from './types';
import { ubCourses, ubDepartments, ubFaculties } from './ub';

// ub.ts is now the complete papers.ndetek.com harvest (every UB faculty,
// department and course), so it is the pool directly — no per-department
// patching needed.
const ubPool: CatalogCourse[] = ubCourses;

export const schools: School[] = [
  { id: 'ub', name: 'University of Buea', shortName: 'UB', levels: ['L200', 'L300', 'L400', 'L500', 'L600'] },
  { id: 'hnd', name: 'Higher National Diploma', shortName: 'HND', levels: ['HND'] },
];

export function facultiesFor(school: SchoolId): Faculty[] {
  return school === 'ub' ? ubFaculties : hndFaculties;
}

export function departmentsFor(facultyId: string): Department[] {
  return [...ubDepartments, ...hndDepartments].filter((d) => d.facultyId === facultyId);
}

export function departmentById(id: string): Department | undefined {
  return [...ubDepartments, ...hndDepartments].find((d) => d.id === id);
}

/**
 * Courses for a department at a level. For HND this always includes the
 * general papers every candidate writes (locked on in onboarding).
 */
export function coursesFor(school: SchoolId, departmentId: string, level: string): CatalogCourse[] {
  if (school === 'hnd') {
    const professional = hndCourses.filter((c) => c.departmentId === departmentId);
    return [...hndGeneralCourses, ...professional];
  }
  const dept = ubPool.filter((c) => c.departmentId === departmentId);
  const atLevel = dept.filter((c) => c.level === level);
  // Some departments publish few courses at a given level; fall back to
  // the whole department so the list is never empty.
  return atLevel.length >= 3 ? atLevel : dept;
}

export function courseByCode(code: string): CatalogCourse | undefined {
  return [...ubPool, ...hndGeneralCourses, ...hndCourses].find((c) => c.code === code);
}

export function searchCatalog(school: SchoolId, departmentId: string, query: string): CatalogCourse[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const pool = school === 'hnd' ? [...hndGeneralCourses, ...hndCourses] : ubPool;
  return pool
    .filter((c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q))
    .slice(0, 30);
}
