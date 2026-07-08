/** Academic catalogue types — Revl launches with UB + the national HND program. */

export type SchoolId = 'ub' | 'hnd';

export type School = { id: SchoolId; name: string; shortName: string; levels: string[] };

export type Faculty = { id: string; schoolId: SchoolId; name: string };

export type Department = { id: string; facultyId: string; name: string };

export type CatalogCourse = {
  code: string;
  title: string;
  /** UB: L200–L700. HND: HND1/HND2 (exam papers sit at HND2). */
  level: string;
  departmentId: string;
  /** HND general papers written by every candidate. */
  general?: boolean;
  /** Required at the HND final exam. */
  required?: boolean;
  /** true = code AND title confirmed from an official/current source. */
  verified: boolean;
  source: string;
};
