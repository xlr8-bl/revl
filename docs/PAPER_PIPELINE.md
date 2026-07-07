# Paper pipeline: raw scans → structured JSON (with cropped diagrams)

Turns student-uploaded past papers (phone photos or scanned PDFs) into
the `Paper`/`Question` JSON this app renders (`src/types/index.ts`),
with diagrams cropped out as images and embedded by URL — at pennies
per paper.

## Principles

- **Extract once, serve forever.** A paper is processed one time; every
  student afterwards reads cached JSON. Per-student marginal cost ≈ 0,
  so we can afford care at ingestion time.
- **Cheap local models for geometry, one multimodal LLM call for
  meaning.** Layout detection and cropping don't need a frontier model;
  question structure and LaTeX do.
- **Humans close the loop, and get paid in credits** — the app already
  has the upload-to-earn economy for this.

## Stages

### 0. Intake & normalization (free, CPU)
- Accept PDF or photos. Render PDFs at 300 DPI (`pypdfium2`).
- Photos: OpenCV dewarp + deskew + shadow removal (docs are phone shots
  in Cameroon — this matters more than OCR choice).
- Keep TWO copies per page: cleaned binarized (for text) and original
  color (for diagram crops). Dedupe uploads by perceptual hash.

### 1. Layout & figure detection (≈ $0, self-hosted)
- Run **DocLayout-YOLO** (or PP-DocLayout) on each page → regions:
  `text | title | figure | table | formula` with bounding boxes.
- Runs on CPU (~1–2 s/page) or any $0.2/hr spot GPU. No API cost.
- **Figures/tables are cropped NOW, from the original color image**,
  with 12 px padding → lossless source of truth for diagrams. Convert
  to WebP (quality 82, max width 1280) → typically 40–150 KB each.

### 2. Structure extraction (the one paid call)
- Send each page image (downscaled to ~1600 px) + the detected figure
  boxes (as `fig_1@bbox…` annotations) to a **cheap multimodal LLM** —
  Gemini Flash-class or Claude Haiku — with the JSON schema and strict
  structured-output mode.
- The model returns the question tree: `number, marks, difficulty,
  topics[], text` (markdown + LaTeX), nested `subQuestions`, and
  `{{fig:fig_1}}` placement markers referencing the detected boxes.
- Why this beats alternatives:
  - Pure OCR (Tesseract) + regex: free but breaks on math, nested
    numbering, and two-column layouts — endless rule-patching.
  - Mathpix: excellent math OCR at ~$0.025/page, a fine **fallback for
    math-dense pages** the LLM flags as low-confidence.
  - Frontier models everywhere: 10–30× the cost for little gain when
    layout is already solved by stage 1.
- Cost: a page image ≈ 1–1.6 K tokens; an 8-page paper ≈ **$0.01–0.05**
  at Flash/Haiku pricing. Use the **batch API (50% off)** — ingestion
  is never latency-sensitive.

### 3. Assembly & diagram embedding
- Replace `{{fig:*}}` markers with `Diagram` entries; upload WebP crops
  to **Cloudflare R2** (S3-compatible, **zero egress fees** — ideal
  since diagrams are read many times) → `imageUrl` + original `bbox`
  stored in the JSON.
- Merge pages, attach paper metadata (course, year, session) from the
  contributor's upload form rather than OCR when possible.

### 4. Validation & human QA (credits, not salaries)
- Machine lint before any human sees it:
  - schema-valid; question numbers continuous; per-question marks sum
    ≈ `totalMarks`; LaTeX parses; every figure referenced exactly once;
    flagged low-confidence spans from the LLM.
- Papers passing all checks auto-publish. Failures enter a **review
  queue** rendered by this very app (side-by-side page image vs.
  rendered JSON) — reviewers are top students/TAs earning credits.
  One human minute per flagged page, not per paper.

### 5. Enrichment (async, batch, once per paper)
- AI worked answers (`answers.aiGeneral`), topic tags, difficulty, and
  prerequisite tags generated in one batched pass — again Flash/Haiku
  batch pricing, ~$0.05–0.15/paper. Verified answers come later from
  the community layer and simply override the AI ones.

## Cost per 8-page paper (all-in)

| Stage | Cost |
| --- | --- |
| Render + preprocess | ~$0 (CPU) |
| Layout detection + crops | ~$0 (self-hosted) |
| LLM structure extraction (batch) | $0.01–0.05 |
| AI answers + tags (batch, once) | $0.05–0.15 |
| Storage (R2, ~2 MB/paper) | ~$0.00003/month |
| **Total** | **≈ $0.06–0.20 one-time** |

10,000 papers ≈ **$600–2,000 one-time** — a corpus, not a burn rate.

## Failure modes to design for

- Handwritten margin notes on scans → layout model classifies as text;
  prompt tells the LLM to ignore non-printed content.
- Multi-paper PDFs → split on detected title pages before stage 1.
- Missing pages → mark paper `partial`; the reader already handles
  papers with zero questions ("still being structured").
- Version the schema (`schemaVersion` field) so reprocessing improves
  old papers without breaking the app.
