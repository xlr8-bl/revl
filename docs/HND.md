# HND (Higher National Diploma) Implementation

Revl supports the Higher National Diploma (HND), Cameroon's national 2-year diploma program with 53 specializations across 7 domains.

## Structure

The HND differs from University of Buea in several key ways:

| Feature | UB | HND |
|---------|----|----|
| Levels | 5 (L200–L600) | 1 (HND, final exam year) |
| Semesters | 2 per year | N/A (single national exam) |
| Domains/Faculties | 12 | 7 |
| Specialties/Departments | 95 | 53 |
| Mandatory courses | None | 6 general papers |
| Exam sitting | February (S1), June (S2) | June only |
| Course selection | Per semester | One-time |

## General Papers (6)

Every HND candidate writes these national papers at the final exam:

- HND-ENG: Use of English
- HND-FRE: Functional French
- HND-CIV: Civics and Ethics
- HND-LAW: General Law
- HND-ENT: Entrepreneurship
- HND-MGT: Introduction to Management

These are auto-selected and locked in onboarding.

## Professional Courses (320)

Each of 53 specialties has 6 required professional courses. The onboarding UI pre-selects all of them (students see the full curriculum for their chosen specialty).

### Verification Status

As of 2026-08-09:

- **Verified** (98 courses from public references):
  - 16 complete domains (96 courses): Accountancy, Banking, HRM, Logistics, Marketing, Civil Engineering, Electrical Power, Software Engineering, ICT specialties (4), Nursing, Midwifery, Medical Laboratory, Hotel Management, Journalism
  - Software Engineering (8 courses, includes extras)

- **Pending** (228 courses awaiting official MINESUP syllabuses):
  - 37 domains with "Professional Practice" + generic specialty courses
  - Structured as: Professional Practice I & II, Applied Technology, Specialty Project, Industrial Organization, Research & Innovation

Students see "pending syllabus" indicator next to unverified courses in the onboarding course picker.

## Onboarding Flow

The HND onboarding skips the level step:

1. **Identity** - Name, username, avatar (standard for all schools)
2. **School** - Choose HND
3. **Faculty/Domain** - Pick one of 7 HND domains
4. **Department/Specialty** - Pick one of the 53 specialties
5. ~~Level~~ - Skipped for HND
6. **Courses** - All courses pre-selected, general papers locked
   - No semester selection (single national exam)
   - No carry-over (retakes from different years don't exist)
7. **Recovery** - Email + phone for Mobile Money users (if applicable)
8. **Done** - Summary with exam date (June 14)

## Data Location

- Faculties: `src/data/catalog/hnd.ts:hndFaculties` (7 items)
- Departments/Specialties: `src/data/catalog/hnd.ts:hndDepartments` (53 items)
- General courses: `src/data/catalog/hnd.ts:hndGeneralCourses` (6 items)
- Professional courses: `src/data/catalog/hnd.ts:hndCourses` (320 items)
- Type definitions: `src/data/catalog/types.ts:CatalogCourse`

## Exam Date

HND students always target the June exam sitting (June 14, derived as S2 in the academic calendar). The onboarding shows "First exam · June" and the days countdown.

## Next Steps

1. **Course verification**: Obtain official MINESUP syllabuses for the 228 pending courses
2. **Past papers**: Ingest actual HND examination papers from ndetek.com
3. **UI enhancements**:
   - Show verification percentage in Courses tab
   - Filter to show/hide pending courses
   - Display syllabus source in course detail
4. **Database migration**: When Supabase is live, sync from this static catalog

## Testing

```bash
# Verify course data integrity
node -e "
const {hndGeneralCourses, hndCourses} = require('./src/data/catalog/hnd');
const codes = new Set();
[...hndGeneralCourses, ...hndCourses].forEach(c => {
  if (codes.has(c.code)) console.log('DUPLICATE:', c.code);
  codes.add(c.code);
});
console.log('Total courses:', codes.size);
console.log('Verified:', [...hndGeneralCourses, ...hndCourses].filter(c => c.verified).length);
"

# Check TypeScript
npx tsc --noEmit
```

## Known Issues

None currently. All 326 HND courses are catalogued with unique codes, and onboarding flow works end-to-end.
