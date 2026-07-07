/** Cameroon state universities + departments per faculty (mock; extend from backend later). */
export const universities = [
  'University of Buea',
  'University of Yaoundé I',
  'University of Douala',
  'University of Bamenda',
  'University of Dschang',
  'University of Ngaoundéré',
];

export const departmentsByFaculty: Record<string, string[]> = {
  ENGINEERING: ['Computer Engineering', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering'],
  MEDICINE: ['Medicine & Surgery', 'Biomedical Sciences', 'Pharmacy', 'Nursing'],
  LAW: ['Public Law', 'Private Law', 'English Law'],
  SCIENCE: ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
  ECONOMICS: ['Economics', 'Management', 'Banking & Finance', 'Marketing'],
  ARTS: ['English', 'History', 'Linguistics', 'Performing Arts'],
  EDUCATION: ['Curriculum Studies', 'Educational Psychology', 'Guidance & Counselling'],
  AGRICULTURE: ['Agronomy', 'Animal Science', 'Agricultural Economics'],
};
