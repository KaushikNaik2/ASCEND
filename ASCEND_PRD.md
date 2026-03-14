# ASCEND — Product Requirements Document
**Version:** 2.0 | **Status:** Draft | **Audience:** Engineering Team & AI Agents | **Date:** March 2026

---

## 0. Architectural Doctrine

> **One sentence:** ASCEND is a concept-first, vector-personalized knowledge assessment engine — it does not teach, it tests.

### Core Rules (Non-Negotiable)
- ASCEND **never teaches** content. It maps what you know and probes the gaps.
- **Structure defines truth. AI refines delivery.** Official curricula define concept scope; LLM generates question variants.
- **LLM is an assistant, not an authority.** All core academic concepts are anchored to official sources, not hallucinated.
- Questions are stored and reused by **concept cluster**, not by syllabus. One question serves CBSE, Mumbai University, and a self-learner simultaneously.
- **Vectors personalize. Metadata controls.** Vectors refine question selection; structured filters (board, cluster, difficulty) gate the retrieval pipeline.
- No uncontrolled live question generation for academic mode. Generate → Validate → Store → Embed → Reuse.

### Two Tracks, One Engine
```
Academic Track          FORGE Track
─────────────           ──────────────
Syllabus-mapped         Domain-selected
Board-anchored          Industry-anchored
Exam-weighted           Skill-weighted
Concept graph from PDF  Concept graph from domain template
```
Both tracks run in **parallel**. Selecting one never locks the other. Weakness vectors, XP, and streaks are **unified** across both.

### What ASCEND Is NOT
- Not a textbook replication system
- Not a video/content platform
- Not a random LLM quiz generator
- Not a crowdsourced wiki
- Not a teaching app

---

## 1. Knowledge Model

### 1.1 Three-Layer Architecture

```
LAYER 1 — Universal Concept Graph (Truth Layer)
  - Board-agnostic, manually curated
  - Contains prerequisite edges between clusters
  - Stable, rarely changes
  - This is the backbone

LAYER 2 — Board/Domain Mapping Layer
  - Maps: Board + Subject + Level → Concept Clusters
  - For Academic: derived from official PDF ingestion
  - For FORGE: derived from domain templates (DSA, Web Dev, AI/ML, System Design)
  - Defines scope, not content truth

LAYER 3 — Assessment Intelligence Layer
  - Built from stored question pools + user performance data
  - PYQ frequency signals determine exam weight
  - Bloom's taxonomy depth per cluster
  - User weakness vectors shape retrieval
```

### 1.2 Knowledge Hierarchy
```
Subject / Domain
  └── Domain
        └── Concept Cluster   ← vector exists here
              └── Questions   ← embedded at cluster level
```

**Why Cluster-level vectors:**
- Subject-level = too coarse for meaningful gap detection
- Micro-fragment level = too sparse, expensive to maintain
- Cluster-level = stable, scalable, cross-board reusable

### 1.3 User Knowledge Vector
- One vector per User × Concept Cluster
- Updated on every quiz attempt:
  - Correct answer → positive weight shift
  - Incorrect answer → negative shift + decay flag
  - Recency factor applied on each session start
- Stored in `pgvector` as `float[]` in the `user_vectors` table

### 1.4 Question Embedding Schema
Each stored question embeds:
- Topic label
- Concept cluster ID
- Difficulty level (1–5)
- Bloom's taxonomy level (Remember / Understand / Apply / Analyze)
- Question text

Used for:
- Semantic gap detection (find clusters with no recent correct answers)
- Non-repetitive retrieval (diversity filter prevents same question twice)

### 1.5 Adaptive Selection Pipeline
```
Structured Filter
(board + cluster + difficulty band)
         ↓
Vector Gap Matching
(cosine similarity against user weakness vector)
         ↓
Diversity Filter
(exclude recently served questions)
         ↓
Serve Question
```

### 1.6 Cluster Linking Rules
- **Prerequisite edges** = hard unlock rule (must pass Cluster A before Cluster B unlocks)
- **Semantic similarity weights** = soft confidence bleed-over (mastery in one cluster slightly boosts confidence score in similar cluster)
- Embeddings **never** define prerequisites. Only curated graph edges do.

---

## 2. Phase 1 — Onboarding & Discovery

### Feature Goal
Capture the student's context (board, subject, level, or FORGE domain), ingest their syllabus PDF, map them to the existing concept graph or create a new one, and initialize their knowledge vector.

---

### UI / Component Breakdown

**Screen 1 — Track Selection**
- Two cards side by side: `Academic` | `FORGE`
- User can select one or both
- No lock-in — both can be activated from the dashboard later

**Screen 2a — Academic Setup**
- Board selector (CBSE / Mumbai University / Pune University / Other)
- Subject selector (dynamically populated from DB for that board)
- Year/Semester input
- PDF upload zone (drag-and-drop, accepts `.pdf` only, max 10MB)

**Screen 2b — FORGE Setup**
- Domain grid: DSA | Web Dev | AI/ML | System Design | DevOps | Database Engineering
- Level selector: Beginner / Intermediate / Advanced
- No PDF required — maps to prebuilt domain concept templates

**Screen 3 — Diagnostic Quiz (Optional but Recommended)**
- 10-question prerequisite test auto-generated from the mapped concept graph
- Goal: initialize the knowledge vector with a non-zero starting state
- Skippable — vector initializes to neutral if skipped
- Shown as: "Let's see where you stand before we start."

---

### Data Ingestion Strategy

#### PDF Ingestion (Academic Track Only)

**Step 1 — Duplicate Check**
```
Hash normalized PDF text (SHA-256)
  → Check hash against `syllabus_index` table
  → If match found: skip to Step 4 (map user to existing graph)
  → If no match: proceed to Step 2
```

**Step 2 — Malicious Content Scan**
```
Extract text via pdfplumber
  → Check for: embedded scripts, suspicious URLs,
    base64 blobs, binary non-text content,
    >3 consecutive non-alphabetic lines
  → If flagged: reject with error "Invalid document format"
  → If clean: proceed to Step 3
```

**Step 3 — Trusted Source Verification (New Documents Only)**
```
Check uploaded PDF metadata + user's institution field
  → Validate against domain whitelist:
    ncert.nic.in | *.ac.in | *.edu | gov.in curriculum portals
  → If institution not on whitelist: prompt user to confirm
    source manually (one-time step per new subject/board)
  → Store verified source alongside concept graph in DB
```

**Step 4 — Concept Graph Extraction**
```
Clean text → LangChain chain → Gemini 1.5 Flash
  → Extract: modules, topics, topic order, prerequisite hints
  → Output: structured JSON matching ConceptGraph schema
  → Validate with Pydantic V2
  → Store in `concept_graphs` table
  → Generate embeddings for each cluster (Gemini Text Embeddings)
  → Store vectors in `concept_vectors` table (pgvector)
```

**Step 5 — User Mapping**
```
Link user_id → concept_graph_id in `user_graphs` table
Initialize user_vectors rows for each cluster (neutral float[])
```

#### FORGE Track (No PDF)
```
User selects domain + level
  → Map to prebuilt domain template in `forge_templates` table
  → Templates are hardcoded by engineering team, not user-generated
  → Link user_id → forge_template_id
  → Initialize user_vectors for FORGE clusters
```

---

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/ingest/pdf` | Upload + scan + extract syllabus PDF |
| `GET` | `/api/v1/subjects?board={id}` | List available subjects for a board |
| `GET` | `/api/v1/forge/domains` | List available FORGE domains |
| `POST` | `/api/v1/onboarding/complete` | Finalize track selection, create user graph mappings |
| `POST` | `/api/v1/diagnostic/start` | Generate 10-question diagnostic from concept graph |
| `POST` | `/api/v1/diagnostic/submit` | Submit answers, initialize knowledge vector |

---

### Acceptance Criteria
- [ ] PDF under 10MB with clean text ingests in under 20 seconds
- [ ] Malicious PDF (embedded script, binary blob) is rejected at scan step with error message
- [ ] Duplicate PDF (same SHA-256 hash) maps directly to existing concept graph without re-extraction
- [ ] New PDF from unverified institution triggers one-time source confirmation prompt
- [ ] FORGE domain selection maps to concept template in under 1 second (no AI processing)
- [ ] Diagnostic quiz generates 10 questions covering at least 5 distinct concept clusters
- [ ] Skipping diagnostic initializes all vector rows to `[0.5, 0.5, ...]` (neutral)
- [ ] User can activate both tracks from onboarding or defer second track to dashboard

---

## 3. Phase 2 — Dual-Track Core Experience

### Feature Goal
Present the user's knowledge state as a navigable graph. Two modes: Academic (syllabus-mapped DAG) and FORGE (domain skill map). User explores nodes, sees their mastery state per cluster, and launches quiz sessions from any node. No content is served — only assessment entry points.

---

### UI / Component Breakdown

**Command Center (Unified Dashboard)**
- Mode switcher at top: `Academic` ↔ `FORGE` (toggle, both always accessible)
- Knowledge Grid: GitHub-style contribution heatmap showing daily quiz activity
- Streak counter, total XP, weak cluster alert banner
- "Continue" button: resumes last active quiz session

**Knowledge Graph View (Three.js)**
- Force-directed 3D graph rendering the concept graph for the active track
- Each node = one concept cluster
- Node color encodes mastery state:
  - `#334155` grey = locked (prerequisite not cleared)
  - `#2563EB` blue = available (unlocked, not yet tested)
  - `#D97706` amber = in progress (partially tested, weak vector)
  - `#059669` green = mastered (vector above threshold)
- Edge = prerequisite relationship (directed, animated particle flow)
- Module clusters grouped spatially by color
- Hover: tooltip (cluster name, mastery %, estimated questions remaining)
- Click: opens Assessment Drawer for that cluster

**Assessment Drawer (Right Panel)**
- Cluster name + module label
- Mastery percentage bar
- "Start Quiz" button → launches adaptive quiz session for this cluster
- Weakness tags: AI-generated labels for sub-topics with low vector scores
- For FORGE: shows industry relevance tag (e.g., "Asked in 73% of frontend interviews")

**Layout Controls (HUD)**
- 3D Force / Radial / Hierarchical / Flat 2D toggle
- Filter by: mastery state, module, estimated time
- Search: fuzzy find cluster by name → camera animates to node

---

### Data Ingestion Strategy
No new PDF ingestion in this phase. All graph data comes from Phase 1.
Graph JSON is fetched from `concept_graphs` table on dashboard load and cached in Zustand store.

---

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/graph/{user_id}/academic` | Fetch academic concept graph with user mastery overlay |
| `GET` | `/api/v1/graph/{user_id}/forge` | Fetch FORGE concept graph with user mastery overlay |
| `GET` | `/api/v1/dashboard/{user_id}` | Fetch heatmap data, streak, XP, weak cluster alerts |
| `POST` | `/api/v1/quiz/start` | Start adaptive quiz session for a cluster |
| `GET` | `/api/v1/cluster/{cluster_id}/weakness` | Get weakness tags for a specific cluster |

---

### Acceptance Criteria
- [ ] Graph renders with correct mastery-state colors for all nodes on load
- [ ] Locked nodes are visually distinct and unclickable until prerequisite is cleared
- [ ] Mode switch between Academic and FORGE re-renders graph in under 500ms
- [ ] Assessment Drawer opens within 100ms of node click
- [ ] "Start Quiz" from any unlocked node launches a session in under 2 seconds
- [ ] Layout switch (3D → Flat 2D) animates smoothly without scene reset
- [ ] Heatmap reflects quiz activity from current day accurately

---

## 4. Phase 3 — Assessment & Adaptive Engine

### Feature Goal
Deliver quiz sessions that adapt in real time to the student's knowledge vector. Every answer updates the vector. The engine surfaces the highest-value questions for closing the user's specific gaps.

---

### UI / Component Breakdown

**Quiz Session Screen**
- Clean single-question view (no distractions)
- MCQ (4 options) as primary format; Short Answer for FORGE code/theory questions
- Timer bar (optional, user-controlled in settings)
- Progress indicator: "Question 4 of 12" + cluster name
- On answer: immediate feedback — correct/incorrect + one-line explanation (Gemini-generated)
- Session ends: score card → vector delta visualization ("Your Gradient Descent score improved by 14%")

**Weak Topic Alert Banner**
- Persistent across dashboard
- Shows top 3 clusters with lowest vector scores
- "Revisit" CTA links directly to Assessment Drawer for that cluster

**Question Bank (Backend — No UI)**
- All questions pre-generated, validated, stored, and embedded before serving
- Generation pipeline: Gemini 1.5 Flash → cross-model validation → human-readable check → store
- No live generation during a quiz session

---

### Question Generation Pipeline (Offline Process)
```
Trigger: new concept cluster added to DB
         ↓
Stage 1 — Generation
  Gemini 1.5 Flash
  Prompt: "Generate 20 MCQ questions for [cluster] at [Bloom level].
           Return strict JSON: {question, options[4], correct_index, explanation}"
         ↓
Stage 2 — Validation
  Cross-model check: Gemini 1.5 Pro verifies correct answer
  Deterministic check: for math/code questions, run answer programmatically
  Reject if: confidence < 0.85 or answer disputed between models
         ↓
Stage 3 — Storage
  Approved questions → `questions` table
  Embed question text → pgvector `question_vectors` table
         ↓
Stage 4 — Reuse
  Same question serves any user mapped to this concept cluster
  regardless of board or institution
```

**Adaptive Difficulty Within Session**
```
Question 1: served at user's current vector difficulty band
Answer correct → next question steps up 0.5 difficulty
Answer incorrect → next question steps down 0.5 difficulty
                → weakness flag set on this cluster
                → vector updated immediately (async)
Session ends → full vector recalculation written to DB
```

---

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/quiz/start` | Initialize session: returns first question + session_id |
| `POST` | `/api/v1/quiz/{session_id}/answer` | Submit answer: returns feedback + next question |
| `GET` | `/api/v1/quiz/{session_id}/result` | End session: returns score card + vector delta |
| `GET` | `/api/v1/user/{user_id}/weaknesses` | Top weak clusters ranked by vector score |
| `POST` | `/api/v1/questions/generate` | (Internal/admin) Trigger offline question generation for a cluster |

---

### Acceptance Criteria
- [ ] Quiz session serves first question in under 1 second
- [ ] Difficulty adjusts correctly after every answer (verified by session log)
- [ ] Vector update written to DB within 5 seconds of session end
- [ ] No question repeats within a 30-day window for the same user + cluster
- [ ] Cross-model validation rejects at least 10% of generated questions (expected failure rate signal)
- [ ] Weak Topic Alert updates within 1 session of a significant vector drop
- [ ] FORGE code questions render with syntax highlighting in the answer options

---

## 5. Phase 4 — Gamification & Community

### Feature Goal
Sustain engagement through XP, streaks, and cross-track rewards. Surface social proof without building a social network. Reward contributors who improve the question bank.

---

### UI / Component Breakdown

**XP & Level System**
- XP earned per: correct answer, session completion, streak maintained, new cluster unlocked
- XP is unified across Academic and FORGE tracks
- Level thresholds: 0–500 (Novice) | 500–2000 (Learner) | 2000–6000 (Practitioner) | 6000+ (Expert)

**Cross-Track Unlocks**
- Mastering a concept cluster in Academic can auto-unlock the equivalent FORGE cluster
- Example: "Passed SQL in Academic (DBMS) → SQL Basics in FORGE (Database Engineering) unlocked"
- Mapping table: `cross_track_links` (manually curated by engineering team, not AI-generated)

**Streak System**
- Daily streak: at least 1 quiz question answered per day
- Streak freeze: one freeze consumable per week (costs 50 XP)
- Longest streak badge displayed on profile

**Contributor Badges**
- Awarded when a user uploads a PDF that becomes a new verified concept graph in the DB
- Badge tiers: First Upload | 5 Unique Subjects | 10 Unique Subjects
- No XP stake, no community voting — verification is done by the system (domain whitelist + malicious scan), not the community

**Leaderboard**
- Weekly XP leaderboard, scoped to same board/institution by default
- Global leaderboard optional (opt-in)

**Context-Aware Chatbot**
- Floating assistant button available on quiz screen and graph view
- Seeded with: current cluster name, last 3 incorrect answers, user's weakness tags
- Uses Gemini 1.5 Flash with a tightly scoped system prompt
- Does not have access to full conversation history — stateless per session
- Purpose: clarify a concept the user just failed on, not general tutoring

---

### API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/user/{user_id}/xp` | Fetch XP, level, streak data |
| `POST` | `/api/v1/xp/award` | (Internal) Award XP on trigger events |
| `GET` | `/api/v1/leaderboard?scope={board/global}` | Fetch weekly leaderboard |
| `GET` | `/api/v1/cross-track/unlocks/{user_id}` | Get newly unlocked FORGE clusters from Academic progress |
| `POST` | `/api/v1/chatbot/message` | Send message to context-aware chatbot |

---

### Acceptance Criteria
- [ ] XP is awarded within 2 seconds of a qualifying action
- [ ] Cross-track unlock notification appears within one session of achieving mastery threshold
- [ ] Streak resets at midnight (user's local timezone)
- [ ] Chatbot response is seeded with correct cluster + weakness context (verified by system prompt log)
- [ ] Leaderboard refreshes every 24 hours
- [ ] Contributor badge is awarded only after concept graph is verified and written to DB (not on upload)

---

## 6. Backend & AI Layer

### Tech Stack Reference
| Component | Technology | Role |
|-----------|-----------|------|
| Language | Python 3.11+ | All backend services |
| Framework | FastAPI | Async API server |
| Validation | Pydantic V2 | Enforce AI output JSON shape |
| PDF Parser | pdfplumber | Text extraction + malicious content scan |
| Orchestration | LangChain | Chain management, structured output |
| LLM — Main | Gemini 1.5 Flash | Concept extraction, question generation, chatbot |
| LLM — Validation | Gemini 1.5 Pro | Cross-model question answer verification |
| Embeddings | Gemini Text Embeddings | Concept cluster + question vectorization |
| Async HTTP | Httpx | External API calls (domain verification) |

### LangChain Chain Architecture

**Chain 1 — Concept Extraction** (Phase 1 PDF ingestion)
```
Input: raw PDF text
System prompt: extract modules, topics, order, prerequisites
Output parser: ConceptGraphSchema (Pydantic)
Model: Gemini 1.5 Flash (high context window, cost-efficient)
```

**Chain 2 — Question Generation** (offline, admin-triggered)
```
Input: cluster label + Bloom level + difficulty band
System prompt: generate 20 MCQs, strict JSON format
Output parser: QuestionBatchSchema (Pydantic)
Model: Gemini 1.5 Flash
Post-step: validation chain (Chain 3)
```

**Chain 3 — Question Validation** (offline, sequential)
```
Input: generated question + answer options + claimed correct_index
System prompt: "Verify: is option [correct_index] factually correct?"
Output: { verified: bool, confidence: float }
Threshold: confidence >= 0.85 to pass
Model: Gemini 1.5 Pro
```

**Chain 4 — Chatbot** (Phase 4, stateless)
```
Input: cluster_name + last_3_incorrect_answers + user_message
System prompt: tightly scoped to concept clarification only
Output: plain text response
Model: Gemini 1.5 Flash
No conversation history stored
```

### Hallucination Control
```
Generate → Validate (Chain 3) → Approve → Store → Embed
Never: Generate → Store immediately
```

### PDF Security Gate (pdfplumber)
```python
# Rejection criteria (checked in order):
1. File size > 10MB → reject before extraction
2. pdfplumber fails to open → reject (corrupt/encrypted)
3. Extracted text < 100 characters → reject (image-only PDF)
4. Text contains: <script, javascript:, base64 blob patterns,
   SQL keyword sequences, executable binary markers → reject
5. Page count < 2 or > 500 → reject (out of range for academic PDF)
# If all pass → clean text forwarded to Chain 1
```

---

## 7. Database Schema

### Supabase (PostgreSQL + pgvector)

**`users`**
```sql
id              uuid PRIMARY KEY
email           text UNIQUE NOT NULL
institution     text
board           text
created_at      timestamp
xp              integer DEFAULT 0
streak_days     integer DEFAULT 0
last_active     date
```

**`concept_graphs`**
```sql
id              uuid PRIMARY KEY
subject_name    text NOT NULL
board           text
source_url      text        -- verified domain URL
source_hash     text UNIQUE -- SHA-256 of extracted text
track           text        -- 'academic' | 'forge'
created_at      timestamp
```

**`concept_clusters`**
```sql
id              uuid PRIMARY KEY
graph_id        uuid REFERENCES concept_graphs(id)
label           text NOT NULL
module_ref      text
bloom_depth     text
difficulty_avg  float
order_index     integer
```

**`cluster_edges`**
```sql
id              uuid PRIMARY KEY
source_id       uuid REFERENCES concept_clusters(id)
target_id       uuid REFERENCES concept_clusters(id)
edge_type       text  -- 'prerequisite' | 'related'
weight          float
```

**`concept_vectors`** (pgvector)
```sql
id              uuid PRIMARY KEY
cluster_id      uuid REFERENCES concept_clusters(id)
embedding       vector(768)   -- Gemini embedding dimension
```

**`questions`**
```sql
id              uuid PRIMARY KEY
cluster_id      uuid REFERENCES concept_clusters(id)
text            text NOT NULL
options         jsonb          -- string[4]
correct_index   integer
explanation     text
difficulty      float          -- 1.0–5.0
bloom_level     text
validated       boolean DEFAULT false
created_at      timestamp
```

**`question_vectors`** (pgvector)
```sql
id              uuid PRIMARY KEY
question_id     uuid REFERENCES questions(id)
embedding       vector(768)
```

**`user_graphs`**
```sql
user_id         uuid REFERENCES users(id)
graph_id        uuid REFERENCES concept_graphs(id)
activated_at    timestamp
PRIMARY KEY (user_id, graph_id)
```

**`user_vectors`** (pgvector — one row per user × cluster)
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
cluster_id      uuid REFERENCES concept_clusters(id)
vector          vector(64)     -- knowledge state vector
last_updated    timestamp
mastery_score   float          -- derived scalar 0.0–1.0
```

**`quiz_sessions`**
```sql
id              uuid PRIMARY KEY
user_id         uuid REFERENCES users(id)
cluster_id      uuid REFERENCES concept_clusters(id)
track           text
started_at      timestamp
ended_at        timestamp
score           float
question_ids    uuid[]
answers         jsonb
```

**`forge_templates`**
```sql
id              uuid PRIMARY KEY
domain          text NOT NULL   -- 'dsa' | 'web_dev' | 'ai_ml' | 'system_design' | 'devops' | 'database_engineering'
level           text            -- 'beginner' | 'intermediate' | 'advanced'
graph_id        uuid REFERENCES concept_graphs(id)
```

**`cross_track_links`**
```sql
id              uuid PRIMARY KEY
academic_cluster_id  uuid REFERENCES concept_clusters(id)
forge_cluster_id     uuid REFERENCES concept_clusters(id)
mastery_threshold    float   -- academic score required to unlock FORGE cluster
```

---

## 8. API Contract

### Base URL: `/api/v1`
### Auth: Supabase JWT on all routes except `/health`

| Method | Route | Request Body | Response |
|--------|-------|-------------|----------|
| `GET` | `/health` | — | `{ status, version }` |
| `POST` | `/ingest/pdf` | `{ file: PDF, user_id, board, subject }` | `{ graph_id, cluster_count, status }` |
| `GET` | `/subjects?board={id}` | — | `Subject[]` |
| `GET` | `/forge/domains` | — | `ForgeDomain[]` |
| `POST` | `/onboarding/complete` | `{ user_id, tracks[], forge_domain?, graph_id? }` | `{ success, redirectTo }` |
| `POST` | `/diagnostic/start` | `{ user_id, graph_id }` | `{ session_id, questions[10] }` |
| `POST` | `/diagnostic/submit` | `{ session_id, answers[] }` | `{ vector_initialized, mastery_preview }` |
| `GET` | `/graph/{user_id}/academic` | — | `KnowledgeGraph` |
| `GET` | `/graph/{user_id}/forge` | — | `KnowledgeGraph` |
| `GET` | `/dashboard/{user_id}` | — | `{ heatmap, streak, xp, weak_clusters[3] }` |
| `POST` | `/quiz/start` | `{ user_id, cluster_id, track }` | `{ session_id, question }` |
| `POST` | `/quiz/{session_id}/answer` | `{ question_id, selected_index }` | `{ correct, explanation, next_question \| session_end }` |
| `GET` | `/quiz/{session_id}/result` | — | `{ score, vector_delta, clusters_updated }` |
| `GET` | `/user/{user_id}/weaknesses` | — | `ClusterWeakness[5]` |
| `GET` | `/user/{user_id}/xp` | — | `{ xp, level, streak, badges[] }` |
| `GET` | `/leaderboard?scope={board\|global}` | — | `LeaderboardEntry[50]` |
| `GET` | `/cross-track/unlocks/{user_id}` | — | `UnlockedForgeCluster[]` |
| `POST` | `/chatbot/message` | `{ user_id, cluster_id, incorrect_question_ids[], message }` | `{ response }` |
| `POST` | `/questions/generate` | `{ cluster_id, count, bloom_level }` *(admin)* | `{ queued: true, job_id }` |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **PDF Ingestion** | New PDF fully processed (scan + extract + embed) in ≤ 25 seconds |
| **Duplicate PDF** | Existing hash lookup + user mapping in ≤ 500ms |
| **Quiz Latency** | First question served in ≤ 1 second from session start |
| **Vector Update** | User vector written to DB within ≤ 5 seconds of session end |
| **Graph Render** | Three.js scene with ≤ 150 nodes renders at ≥ 60fps on mid-range hardware |
| **API Availability** | ≥ 99.5% uptime; Gemini outage degrades gracefully (cached questions served) |
| **Security** | All routes JWT-authenticated; PDF scan gate blocks malicious uploads; parameterized queries throughout (no raw SQL string interpolation) |
| **Scalability** | Question generation is async/queued; never blocks user-facing API response |
| **Browser Support** | Chrome 120+ / Firefox 121+ / Safari 17+; WebGL 2.0 required for 3D; flat 2D fallback for WebGL unavailable |
| **Data Retention** | Quiz session logs retained 12 months; user vectors retained indefinitely |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| PDF ingestion success rate | ≥ 95% | Count of `/ingest/pdf` calls returning `status: success` |
| Malicious PDF rejection rate | 100% of flagged files | Scan gate logs |
| Question validation pass rate | 85–92% (reject ~10% as expected) | Generation job logs |
| Quiz session completion rate | ≥ 70% of started sessions | `quiz_sessions.ended_at IS NOT NULL` |
| Vector update accuracy | 0 missed updates post-session | Session end → DB write reconciliation |
| Daily active users (D30) | ≥ 40% of registered users | `last_active` date frequency |
| Cross-track unlock trigger rate | ≥ 20% of users with both tracks active | `cross_track_links` fire events |
| Three.js graph FPS | ≥ 60fps p95 | Performance.mark() in client |
| Chatbot context accuracy | Correct cluster seeded in 100% of calls | System prompt log audit |

---

## 11. Future Scope (v2.0)

- **Peer Battles:** Real-time quiz duels wagering XP against a classmate on the same concept cluster
- **Interview Mode:** Voice-mode AI conducts mock technical interviews based on completed FORGE clusters
- **Offline Mode:** Download question bank and cluster graph for low-connectivity environments
- **State Board Expansion:** Extend board mapping layer to Maharashtra SSC, Karnataka PU, ICSE
- **Spaced Repetition Engine:** Schedule cluster revisits based on Ebbinghaus forgetting curve applied to mastery vector decay
- **Performance Analytics Export:** Student exports their vector history as a PDF report for placement interviews

---

*Document generated by ASCEND Engineering — v2.0 — March 2026*
*Next review: after Phase 1 implementation complete*
