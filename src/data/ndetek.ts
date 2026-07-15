/**
 * Real Computer Engineering catalogue, harvested from papers.ndetek.com
 * (the NdeTek Papers archive of Cameroon university past questions). Each
 * entry is a course that ACTUALLY has past papers on record there — titles
 * cleaned from the archive's paper slugs, `papersOnRecord`/`firstYear`/
 * `lastYear` summarising how many exist and across which years.
 *
 * This is metadata only: it tells the app which real courses and how many
 * real papers exist. The structured, answerable paper CONTENT is a
 * separate ingestion step (docs/PAPER_PIPELINE + docs/PAPER_REVIEW) — this
 * file is what makes the Courses list reflect the real archive today.
 *
 * Source: https://papers.ndetek.com  ·  283 CEC papers across 52 courses,
 * 2018-2026. Generated from the site's public sitemap.
 */
import type { CatalogCourse } from './catalog/types';

export const NDETEK_BASE = 'https://papers.ndetek.com/en';

export const ndetekCecCourses: CatalogCourse[] = [
  { code: 'CEC207', title: "Computer for Business", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2018, lastYear: 2018 },
  { code: 'CEC209', title: "Introduction to Computer Networks", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 11, firstYear: 2019, lastYear: 2025 },
  { code: 'CEC213', title: "Fundamentals of Programming", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 16, firstYear: 2019, lastYear: 2026 },
  { code: 'CEC217', title: "Computer Architecture", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 9, firstYear: 2020, lastYear: 2025 },
  { code: 'CEC218', title: "Data Analysis and Machine Learning", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 4, firstYear: 2021, lastYear: 2022 },
  { code: 'CEC220', title: "Operating Systems", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 6, firstYear: 2021, lastYear: 2022 },
  { code: 'CEC221', title: "Static Web Design", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2022, lastYear: 2025 },
  { code: 'CEC223', title: "Introduction to Algorithms and Complexity", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 11, firstYear: 2021, lastYear: 2025 },
  { code: 'CEC224', title: "Software Architecture", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 11, firstYear: 2020, lastYear: 2025 },
  { code: 'CEC226', title: "Scripting Languages", level: 'L200', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 17, firstYear: 2019, lastYear: 2025 },
  { code: 'CEC302', title: "Object-Oriented Programming", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 11, firstYear: 2021, lastYear: 2024 },
  { code: 'CEC304', title: "Data Integrity and Security", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 13, firstYear: 2020, lastYear: 2025 },
  { code: 'CEC305', title: "Data Structures and Algorithms", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 10, firstYear: 2022, lastYear: 2026 },
  { code: 'CEC306', title: "System Analysis and Design", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 6, firstYear: 2022, lastYear: 2024 },
  { code: 'CEC315', title: "Introduction to Cloud Computing", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 10, firstYear: 2020, lastYear: 2026 },
  { code: 'CEC317', title: "Database Management Systems", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 7, firstYear: 2021, lastYear: 2025 },
  { code: 'CEC318', title: "Mobile App Development", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2026 },
  { code: 'CEC319', title: "Dynamic Web Design", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 5, firstYear: 2020, lastYear: 2026 },
  { code: 'CEC320', title: "Embedded Systems", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 5, firstYear: 2022, lastYear: 2024 },
  { code: 'CEC321', title: "Programming with UML", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 11, firstYear: 2020, lastYear: 2025 },
  { code: 'CEC322', title: "Computer Network Protocols", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2020, lastYear: 2020 },
  { code: 'CEC323', title: "Introduction to AI and Machine Learning", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 7, firstYear: 2021, lastYear: 2026 },
  { code: 'CEC325', title: "Introduction to Networking and Security", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2021, lastYear: 2021 },
  { code: 'CEC327', title: "Python for Networking", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC329', title: "Computer Networks I", level: 'L300', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 2, firstYear: 2025, lastYear: 2026 },
  { code: 'CEC405', title: "Wireless Communication", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2020, lastYear: 2020 },
  { code: 'CEC412', title: "Introduction to Visual Instrumentation", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 4, firstYear: 2023, lastYear: 2025 },
  { code: 'CEC417', title: "Mobile Application Development", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 10, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC418', title: "Software Construction and Evolution", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2024 },
  { code: 'CEC420', title: "Data Mining", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2023, lastYear: 2024 },
  { code: 'CEC424', title: "Deep Learning", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2023, lastYear: 2024 },
  { code: 'CEC427', title: "Fundamentals of Data Analysis", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 5, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC430', title: "Full-Stack Web Development", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2023, lastYear: 2025 },
  { code: 'CEC431', title: "Software Process and Quality", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 8, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC433', title: "Mobile Applications for Embedded Systems", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 2, firstYear: 2024, lastYear: 2025 },
  { code: 'CEC434', title: "Data Visualisation", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 4, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC435', title: "Machine Learning", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2022, lastYear: 2025 },
  { code: 'CEC436', title: "Wireless-Based Applications", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 2, firstYear: 2024, lastYear: 2025 },
  { code: 'CEC441', title: "TCP and IP Socket Programming", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2026 },
  { code: 'CEC443', title: "Mobile Wireless Networks", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2025 },
  { code: 'CEC445', title: "Network Routing Protocols", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 2, firstYear: 2024, lastYear: 2025 },
  { code: 'CEC446', title: "Wireless Sensor Networks", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2023, lastYear: 2023 },
  { code: 'CEC449', title: "Cybersecurity Principles", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 4, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC461', title: "Information Systems Security", level: 'L400', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 8, firstYear: 2022, lastYear: 2026 },
  { code: 'CEC601', title: "Advanced Software Development", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2026 },
  { code: 'CEC603', title: "Information Systems and Network Security", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 8, firstYear: 2023, lastYear: 2026 },
  { code: 'CEC605', title: "Cloud Architecture", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2026 },
  { code: 'CEC610', title: "Utility Computing", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2024, lastYear: 2026 },
  { code: 'CEC612', title: "FPGA-Based Embedded Systems", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 3, firstYear: 2022, lastYear: 2026 },
  { code: 'CEC616', title: "Deep Learning", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2022, lastYear: 2022 },
  { code: 'CEC618', title: "Advanced Data Structures and Algorithms", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 1, firstYear: 2025, lastYear: 2025 },
  { code: 'CEC621', title: "Artificial Intelligence", level: 'L600', departmentId: 'computer-engineering', verified: true, source: 'papers.ndetek.com', papersOnRecord: 5, firstYear: 2022, lastYear: 2025 },
];

/** Total real past papers on record across the harvested CEC courses. */
export const ndetekCecPaperCount = ndetekCecCourses.reduce(
  (n, c) => n + (c.papersOnRecord ?? 0),
  0
);
