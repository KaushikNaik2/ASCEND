# ASCEND — Frontend Product Requirements Document

**Version:** 1.0  
**Tech Stack:** React (Vite) · TypeScript · Tailwind CSS · Three.js · Framer Motion · Zustand · React Router DOM · Lucide React  
**Base Code:** Existing frontend codebase (retain all existing utilities, store, canvas, and types — only pages/components listed below are modified or added)

---

## 1. Design System (Unchanged — Retain from Existing Codebase)

| Token | Value |
|---|---|
| Background | `#0f172a` (slate-950) |
| Surface / Glass panel | `rgba(30, 41, 59, 0.6)` + `backdrop-blur-xl` |
| Primary | `#3b82f6` (blue-500) |
| Accent | `#8b5cf6` (purple-500) |
| Pink highlight | `#ec4899` (pink-500) |
| Text primary | `#f8fafc` (white) |
| Text muted | `#94a3b8` (slate-400) |
| Border | `rgba(255,255,255,0.1)` |
| Border radius card | `rounded-2xl` / `rounded-3xl` |
| Font | Inter (sans) |

**Reuse** the `glass-panel` utility class, `CustomCursor`, `KnowledgeConstellation` Three.js background, and `useStore` Zustand store across all pages.

---

## 2. Global State Additions (`src/store/useStore.ts`)

Extend the existing Zustand store with:

```ts
interface AppState {
  // existing fields...
  mode: 'academics' | 'skills' | null;   // selected mode
  setMode: (mode: 'academics' | 'skills') => void;

  signupData: {                           // persists across signup steps
    name: string;
    dob: string;
    phone: string;
    profession: string;
    workplace: string;
    qualification: string;
    hasCurrentCourse: boolean | null;
    courseName: string;
    university: string;
    city: string;
  };
  setSignupData: (data: Partial<AppState['signupData']>) => void;
}
```

---

## 3. Route Map (`src/App.tsx`)

| Path | Component | Notes |
|---|---|---|
| `/` | `LandingPage` | Modified |
| `/login` | `AuthPage type="login"` | Unchanged |
| `/signup` | `SignUpPage` | Replaced — new multi-step |
| `/mode-selection` | `ModeSelectionPage` | New |
| `/home` | `HomePage` | New — renders Academics or Skills view based on `mode` in store |
| `/upload-curriculum` | `UploadCurriculumPage` | New |
| `/quiz` | `QuizPage` | New |
| `/roadmap` | `RoadmapPage` | Simplified (see §10) |
| `/dashboard` | `DashboardPage` | Unchanged |

---

## 4. Shared Navbar Component (`src/components/layout/AppNavbar.tsx`)

Used on: Home, Upload Curriculum, Quiz, Roadmap, Dashboard pages (all post-auth pages).

**Layout:** Full-width horizontal bar. Black/dark background with slight blur.

**Items (left to right):**
1. ASCEND logo icon (blue-teal gradient square with "A")
2. `Home` icon button — navigates to `/home`
3. Roadmap icon button — navigates to `/roadmap`
4. Quiz icon button — navigates to `/quiz`
5. Bar chart / Dashboard icon — navigates to `/dashboard`
6. Profile avatar icon (circle) — right edge

**Active state:** The active page icon/label is highlighted with a **pink pill background** (`bg-pink-500 text-white rounded-full px-3 py-1`). All others are default gray.

**Reference:** See Image 1 (Quiz page navbar) and Image 3 (Home page navbar). The Quiz page shows "QUIZ" text label in a pink pill. Home page shows "HOME" text label in a pink pill. Other pages show only the icon, no text.

---

## 5. Landing Page (`src/pages/LandingPage.tsx`) — MODIFIED

### 5.1 Header / Navbar

Replace the existing header with:

- **Left:** ASCEND logo + wordmark
- **Right:** Single **"Login"** button — outlined style (`border border-white/20 rounded-full px-5 py-2`) — navigates to `/login`
- Remove the existing Sign In + Get Started dual buttons from the header

### 5.2 Hero Section

- Keep headline and subtext as-is
- Replace the two CTA buttons (`Upload Syllabus` + `Browse Roadmaps`) with a **single** button:
  - Label: **"Get Started"**
  - Style: white filled, full-rounded pill, bold, with arrow icon — same as existing `Upload Syllabus` button styling
  - On click: navigates to `/signup`

### 5.3 How It Works Section

Replace the existing three step cards with:

| Card | Icon | Title | Description |
|---|---|---|---|
| 1 | `ClipboardCheck` (Lucide) | **Diagnostic Test** | We assess your existing knowledge before building your path |
| 2 | `BrainCircuit` (Lucide) | **AI Powered Learning Path** | Our AI generates a personalized roadmap tailored to your syllabus and skill gaps |
| 3 | `TrendingUp` (Lucide) | **Progress Tracking** | Track every topic, streak, and milestone as you advance |

Card layout: same glass panel style as existing How It Works cards. Icon in a rounded square, bold title, muted description text.

### 5.4 Everything Else

Keep `FeaturedRoadmapsGrid`, `StatsSection`, and `Footer` unchanged.

---

## 6. Sign In Page (`src/pages/AuthPage.tsx`) — UNCHANGED

No changes required. Keep the existing two-panel layout with `AuthForm`.

---

## 7. Sign Up Page (`src/pages/SignUpPage.tsx`) — FULL REPLACEMENT

Multi-step card wizard. Three cards shown one at a time; transitions use `framer-motion` `AnimatePresence` sliding left/right.

**Overall layout:** Full-screen centered. Same two-panel structure as the existing AuthPage (left decorative panel on desktop, right form panel). Progress indicator: three dots or step bar at the top of the form panel showing Step 1 / 2 / 3.

---

### 7.1 Card 1 — Personal Details

Fields:
- **Full Name** — text input, required
- **Date of Birth** — date input (`<input type="date">`) styled consistently, required
- **Phone Number** — tel input with country code prefix dropdown (default +91), required

Actions:
- **"Next →"** button (primary blue/purple gradient) — validates fields, saves to `signupData` in store, animates to Card 2
- **"Already have an account? Sign In"** link below

---

### 7.2 Card 2 — Professional Details

Fields:
- **Profession** — radio button group styled as selectable pill cards:
  - Option A: `Student` (with graduation cap icon)
  - Option B: `Working Professional` (with briefcase icon)
- **Workplace** — text input (label: "School / College / Company Name"), required
- **Qualification** — text input (e.g., "B.Tech CSE Year 2"), required
- **Current Course** — yes/no toggle:
  - Render as two large pill buttons: **Yes** | **No**
  - Highlight selected with blue/purple fill

Actions:
- **"← Back"** link — goes back to Card 1
- **"Next →"** button:
  - If `Current Course = Yes` → animate to Card 3
  - If `Current Course = No` → save data, navigate to `/mode-selection`

---

### 7.3 Card 3 — Course Details

Shown only if user selected "Yes" on Current Course.

Fields:
- **Course Name** — text input (e.g., "B.Tech Computer Science"), required
- **University / Institution** — text input, required
- **City** — text input, required

Actions:
- **"← Back"** — goes back to Card 2
- **"Complete Sign Up"** button (primary gradient) — saves all data, creates user session (`setAuthenticated(true)`), navigates to `/mode-selection`

---

## 8. Mode Selection Page (`src/pages/ModeSelectionPage.tsx`) — NEW

**Purpose:** After sign-up (or after every login), user picks their mode for this session.

**Layout:** Centered on screen, dark background with Three.js constellation. No top navbar.

**Content:**
- Heading: `"Choose Your Mode"` — large, white, bold
- Subtext: `"Select how you'd like to learn today"` — slate-400
- Two large cards side by side (or stacked on mobile):

| Card | Icon | Title | Subtitle | Color accent |
|---|---|---|---|---|
| Left | `GraduationCap` | **Academics** | "Structured learning from your curriculum" | Blue (`border-blue-500/40`, blue glow on hover) |
| Right | `Rocket` / `Zap` | **Skills** | "Career-focused skill-building paths" | Pink/Purple (`border-pink-500/40`, pink glow on hover) |

- Each card: `glass-panel` + `rounded-3xl` + `p-10` + icon centered + bold title + muted subtitle + hover scale effect
- On click: `setMode('academics' | 'skills')` → navigate to `/home`

**Note:** This page is reached after sign-up AND after every subsequent login (redirect `/login` success → `/mode-selection` → `/home`).

---

## 9. Home Page (`src/pages/HomePage.tsx`) — NEW

This single component renders differently based on `mode` in the store. Refer to **Image 3** (both left and right panels).

### 9.1 Layout

Uses `AppNavbar` at top. Body has a light gray/off-white card background (the inner content area is a rounded, light-colored panel — distinct from the dark Three.js background).

**Body panel:** Large rounded rectangle `bg-slate-100/90` or `bg-white/10 backdrop-blur` containing all content below.

### 9.2 Mode Toggle Button

Positioned **top-right of the body panel** (not in the navbar):
- Shows current mode: e.g., `"ACADEMICS MODE 🎓"` or `"SKILLS MODE 🚀"`
- Styled as a small rounded pill with white background and dark text + mode icon
- **On click:** switches `mode` in the store (toggles between `'academics'` and `'skills'`)
- On switch, the entire Home page content animates/re-renders for the new mode

### 9.3 Greeting

`"HELLO [USER NAME]!!"` — large, bold, black/dark text at top-left of the body panel.

### 9.4 View Analytics Section

Label: `"VIEW ANALYTICS"` — small uppercase label

Horizontal scrollable row of subject/topic cards:
- **Academics mode:** Cards labeled `SUBJECT A`, `SUBJECT B`, `SUBJECT C` etc. (replaced by actual subjects from user's curriculum)
- **Skills mode:** Cards labeled `TOPIC A`, `TOPIC B`, `SUBJECT C` etc. (replaced by user's skill domains)
- Each card: white/light bordered square `~100x80px`, centered label, subtle shadow
- Left `←` and right `→` arrow buttons for scrolling

### 9.5 Action Buttons

Two full-width (or near-full) buttons stacked at the bottom of the body panel:

| Button | Label | Style | Action |
|---|---|---|---|
| 1 | VIEW ROADMAP | Outlined pink/purple pill, thin border | Navigate to `/roadmap` |
| 2 (Academics) | TAKE A QUIZ 🔔 | Outlined lighter pink, with bell icon | Navigate to `/quiz` |
| 2 (Skills) | TAKE A QUIZ | Solid pink/purple fill | Navigate to `/quiz` |

**Academics mode:** Both buttons outlined.  
**Skills mode:** "TAKE A QUIZ" uses a solid filled pink/purple — matches the stronger gamification element in Skills.

---

## 10. Upload Curriculum Page (`src/pages/UploadCurriculumPage.tsx`) — NEW

Reference: **Image 2** (Upload Curriculum screenshot).

Uses `AppNavbar`. **The navbar on this page shows lock icons** over each nav item except Profile — conveying that content is locked until curriculum is added. Render the lock icons as small overlay badges on each nav icon.

### 10.1 Page Header

- `"UPLOAD CURRICULUM"` — large, bold, uppercase, centered or left-aligned

### 10.2 Two-Column Layout

**Left Column:**

Label: `"SCAN YOUR TEXTBOOK INDEXES TO ADD THE SUBJECTS"` — small, muted, uppercase

Below the label: A scan/camera target box:
- Dashed border rectangle (~200×150px)
- Animated corner brackets (L-shaped corners) in blue/indigo
- Center: camera or scan icon
- On click: opens file picker OR triggers camera (use `<input type="file" accept="image/*" capture="environment">`)

Note at bottom of left column:  
`*NOTE: THESE INDEXES WOULD BE CROSS-REFERENCED WITH OFFICIAL WEBSITES FOR ACCURACY`  
Small, italic, muted slate text.

**Right Column:**

Label: `"SUBJECTS ADDED:"` — bold, uppercase

List of added subjects as status chips:
- **Verified chip:** Subject name + green checkmark circle icon, green text/border (`bg-green-100 border-green-400 text-green-700`). Label below: `*VERIFIED` in small green text.
- **Rejected chip:** Subject name + red X circle icon, red text/border (`bg-red-100 border-red-400 text-red-700`). Label below: `*REJECTED` in small red text + `retake` link.
- Chips are pill-shaped, bordered, with icon on right.

**Bottom-right link:**  
`* Have a digital copy` → `UPLOAD HERE` (underlined, blue link) — opens PDF file picker.

---

## 11. Quiz Page (`src/pages/QuizPage.tsx`) — NEW

Reference: **Image 1** (Quiz page screenshot).

Uses `AppNavbar`. The **Quiz icon/label in the navbar is highlighted** (pink pill active state).

### 11.1 Back Navigation

Top-left of content: `← HOME` — small text link, navigates to `/home`

### 11.2 Question Area

- **Question number + topic:** `Q.1.` in bold, with small label above the answer box: `Topic : Calculus` (gray, italic, small)
- **Question box:** Large white/light bordered rectangle, centered `"QUESTION"` placeholder text. Full-width, rounded, prominent.

### 11.3 Answer Options

Four equal-width buttons in a row (or 2×2 on mobile):
- Labeled `A`, `B`, `C`, `D`
- Style: white/light bordered rounded rectangles, equal size
- On hover: light blue highlight
- On select: selected option gets blue fill + white text

### 11.4 "I Don't Know" Link

Centered below the four answer buttons:  
`I don't know` — small, underlined, blue link text. On click: skips question and records as unanswered.

### 11.5 Navigation Bar

Full-width bottom bar with yellow background (`bg-yellow-400`):
- Left: `←` green circle button (previous question)
- Center: `1/10` — current question count, small text
- Right: `→` green circle button (next question)

### 11.6 Note Banner

Below the yellow navigation bar:  
`*NOTE : THIS IS A BASIC KNOWLEDGE CHECK QUIZ OF 10 QUESTIONS`  
Full-width, yellow background, black bold text, centered.

### 11.7 Quiz Logic

- 10 questions total (mock data for now)
- State: `currentQuestion` (0–9), `answers` (array of selected options or null)
- On completing Q10 and clicking `→`: navigate to `/home` or show a score summary modal

---

## 12. Roadmap Page (`src/pages/RoadmapPage.tsx`) — SIMPLIFIED

Keep the existing `RoadmapViewer` tree layout. Remove the floating AI Tutor button and the right sidebar for now. Show only:
- Progress bar at top
- Vertical timeline tree of modules and topics
- Topic completion checkboxes

Uses `AppNavbar`. Roadmap icon active in navbar.

---

## 13. Dashboard Page (`src/pages/DashboardPage.tsx`) — UNCHANGED

Keep exactly as-is. Uses `AppNavbar` (replace existing `Header` import with `AppNavbar`). Dashboard/bar-chart icon active in navbar.

---

## 14. File Structure Changes

```
src/
├── components/
│   ├── canvas/
│   │   └── KnowledgeConstellation.tsx      ← unchanged
│   ├── layout/
│   │   ├── Header.tsx                       ← keep for Landing page only
│   │   └── AppNavbar.tsx                    ← NEW: post-auth navbar
│   └── ui/
│       ├── AuthForm.tsx                     ← unchanged
│       ├── CustomCursor.tsx                 ← unchanged
│       ├── ModeToggleButton.tsx             ← NEW: reusable mode toggle pill
│       └── SubjectCard.tsx                  ← NEW: analytics card chip
├── pages/
│   ├── LandingPage.tsx                      ← modified
│   ├── AuthPage.tsx                         ← unchanged (Sign In)
│   ├── SignUpPage.tsx                       ← NEW (replaces AuthPage signup)
│   ├── ModeSelectionPage.tsx                ← NEW
│   ├── HomePage.tsx                         ← NEW
│   ├── UploadCurriculumPage.tsx             ← NEW
│   ├── QuizPage.tsx                         ← NEW
│   ├── RoadmapPage.tsx                      ← simplified (from RoadmapViewer)
│   └── DashboardPage.tsx                    ← unchanged
├── store/
│   └── useStore.ts                          ← extend with mode + signupData
└── types/
    └── index.ts                             ← add Mode type
```

---

## 15. Updated Routing (`src/App.tsx`)

```tsx
<Routes>
  <Route path="/"                  element={<LandingPage />} />
  <Route path="/login"             element={<AuthPage type="login" />} />
  <Route path="/signup"            element={<SignUpPage />} />
  <Route path="/mode-selection"    element={<ModeSelectionPage />} />
  <Route path="/home"              element={<HomePage />} />
  <Route path="/upload-curriculum" element={<UploadCurriculumPage />} />
  <Route path="/quiz"              element={<QuizPage />} />
  <Route path="/roadmap"           element={<RoadmapPage />} />
  <Route path="/dashboard"         element={<DashboardPage />} />
  <Route path="*"                  element={<Navigate to="/" replace />} />
</Routes>
```

Remove legacy routes: `/roadmaps`, `/roadmap/:id`, `/roadmap/:id/plan`, `/generate`, `/guides`.

---

## 16. Navigation Flows

```
Landing (/)
  └─ [Login btn]         → /login  → /mode-selection → /home
  └─ [Get Started btn]   → /signup
        └─ Step 1 → Step 2
              └─ [No current course] → /mode-selection → /home
              └─ [Yes]              → Step 3 → /mode-selection → /home

/home
  └─ [VIEW ROADMAP]      → /roadmap
  └─ [TAKE A QUIZ]       → /quiz
  └─ [Mode Toggle]       → switch mode in store, re-render /home

/upload-curriculum       → reached from Roadmap navbar (first-time academics flow)

/quiz
  └─ [← HOME]            → /home
  └─ [Complete quiz]     → /home (or score modal)

AppNavbar (all post-auth pages)
  └─ Home icon           → /home
  └─ Roadmap icon        → /roadmap
  └─ Quiz icon           → /quiz
  └─ Dashboard icon      → /dashboard
```

---

## 17. Animation & Interaction Specifications

| Interaction | Animation |
|---|---|
| Sign Up step transitions | `framer-motion` slide: exit `x: -100, opacity: 0`, enter `x: 100 → 0, opacity: 0 → 1` |
| Mode Selection card hover | `scale(1.03)` + glow border color transition (200ms ease) |
| Home mode toggle | Fade cross-dissolve: `opacity: 0` → re-render → `opacity: 1` (300ms) |
| Quiz answer select | Button background fills instantly, border turns blue |
| Quiz question transition | Slide left/right with `AnimatePresence` |
| Upload curriculum subject chip appear | Stagger fade-in from bottom |
| Page transitions (route change) | Keep existing `AnimatePresence mode="wait"` with `opacity` fade |

---

## 18. Mock Data Requirements

All API calls are mocked for now.

**Quiz mock data (`src/lib/mockQuiz.ts`):**
```ts
export const mockQuiz = [
  { id: 1, topic: "Calculus", question: "What is the derivative of x²?", options: ["2x", "x²", "2", "x"], answer: "2x" },
  // ... 9 more questions
]
```

**Subjects mock data (`src/lib/mockSubjects.ts`):**
```ts
export const mockAcademicsSubjects = ["Mathematics-I", "Physics", "Chemistry", "Data Structures"];
export const mockSkillsTopics = ["Python Basics", "Machine Learning", "Web Dev"];
```

**Upload Curriculum mock subjects (pre-populated in `UploadCurriculumPage`):**
```ts
const mockAdded = [
  { name: "MATHEMATICS-I", status: "verified" },
  { name: "SOCIAL STUDIES", status: "rejected" },
]
```

---

## 19. Types Additions (`src/types/index.ts`)

```ts
export type Mode = 'academics' | 'skills';

export interface QuizQuestion {
  id: number;
  topic: string;
  question: string;
  options: string[];
  answer: string;
}

export interface SubjectChip {
  name: string;
  status: 'verified' | 'rejected' | 'pending';
}

export interface SignupData {
  name: string;
  dob: string;
  phone: string;
  profession: 'student' | 'working_professional' | '';
  workplace: string;
  qualification: string;
  hasCurrentCourse: boolean | null;
  courseName: string;
  university: string;
  city: string;
}
```

---

## 20. Tailwind Utility Notes

- Reuse `glass-panel` class from `index.css` across all new pages
- New utility to add in `index.css`:
```css
.yellow-bar {
  background: #facc15; /* yellow-400 */
}
.scan-box {
  border: 2px dashed rgba(99,102,241,0.5);
  border-radius: 12px;
}
```
- Pink active state for nav: `bg-pink-500 text-white` on the active nav item pill

---

## 21. Component Implementation Priorities

Build in this order:

1. `useStore.ts` — extend state
2. `AppNavbar.tsx` — shared post-auth navbar
3. `ModeSelectionPage.tsx` — simple, unblocks all other pages
4. `SignUpPage.tsx` — multi-step cards
5. `HomePage.tsx` — core post-auth landing
6. `QuizPage.tsx` — quiz flow
7. `UploadCurriculumPage.tsx` — scan + subject chips
8. `LandingPage.tsx` — modifications only
9. `RoadmapPage.tsx` — simplification
10. `App.tsx` — route updates

---

*End of PRD — ASCEND Frontend v1.0*
