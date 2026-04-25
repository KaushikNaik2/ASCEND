# ASCEND Backend — Developer Notes

This document tracks the technical implementation, architectural decisions, and progress of the ASCEND backend.

---

## 🏗️ Project Architecture

The backend is built with **FastAPI** and uses a service-oriented structure:
- `main.py`: ASGI application entry point and configuration.
- `api/routers/`: Modularized API endpoints (e.g., `syllabus`, `quiz`).
- `core/`: Cross-cutting concerns (security, configuration, LLM templates).
- `services/`: Business logic (PDF processing, Database singleton, LLM orchestration).
- `schemas/`: Pydantic models for data validation and structured AI output.
- `tests/`: Unit, integration, and stress test suites.

---

## 🚀 Implemented Features

### 1. Security & Request Validation
- **Content Size Limit**: A custom ASGI middleware (`ContentSizeLimitMiddleware`) enforces a strict **5MB** limit on all incoming requests to prevent memory exhaustion and DoS attacks.
- **PDF Magic Number Check**: The `/upload-syllabus` endpoint reads the first few bytes of uploaded files to verify the `%PDF` signature before processing, ensuring file integrity.
- **CORS Configuration**: Restricted to specific frontend origins (localhost:3000, 5173).

### 2. Advanced DS NLP Cleaner
**Location**: `services/pdf_service.py`
**Why**: Raw PDF text is often filled with formatting "noise" (headers, footers, ligatures) that consumes unnecessary tokens and confuses LLMs.
**Implementation**: A 4-stage pipeline using `AdvancedNLPCleaner`:
1. **Unicode Normalization**: Collapses ligatures (ﬁ → fi), maps curly quotes to ASCII, and strips zero-width/invisible characters.
2. **Structural Cleanup**: Regex pass to remove "Page X of Y" headers, centered page numbers, and repeated punctuation.
3. **Statistical Noise Reduction**: Filters lines where the digit-to-text ratio is > 60% (likely table data) or line length is < 4 characters.
4. **Final Collapse**: Standardizes whitespace and newlines.

### 3. PDF Extraction & Subject Splitting
- Uses `pdfplumber` for high-fidelity text extraction.
- **Subject Splitting**: Long semester PDFs are automatically split into individual subject chunks based on Mumbai University patterns (e.g., "Course Code", "Subject Code"). This prevents token truncation and allows parallel/throttled processing.

### 4. Gemini AI Orchestration
**Location**: `services/llm_service.py`
- **Model**: `gemini-3.1-flash-lite-preview` (Fast & Cost-effective).
- **Structured Output**: Uses LangChain's `.with_structured_output()` with Pydantic schemas to ensure Gemini always returns valid JSON.
- **Throttling**: Implements a **4.5-second sleep** between subject chunks to strictly respect the 15 Requests Per Minute (RPM) free-tier limit.

### 5. API Modularization & Adaptive Assessments
- **Modularized Routers**: Monolithic endpoints have been extracted from `main.py` into dedicated routers (`api/routers/syllabus.py`, `api/routers/quiz.py`).
- **Advanced Schemas**: Enhanced `schemas/quiz.py` with `AdaptiveQuestion`, which holds rich vector metadata like `blooms_taxonomy_level`, `difficulty_level`, and `primary_concept`.
- **Database Operations**: Extended the Supabase `DatabaseManager` for Vault Operations (SSOT extraction, draft creation) and Proficiency Operations (tracking user topic-level mastery).
- **Centralized Templates**: LLM prompts have been refactored out of service layers into `core/templates.py` for cleaner separation of logic and content.

---

## 📜 Technical Changelog

### [2026-04-11] — API Modularization & Data Schema Expansion
- **Modularized**: Extracted monolithic routes from `main.py` into `api/routers/syllabus.py` and `api/routers/quiz.py`.
- **Refactored**: Centralized LLM prompts into `core/templates.py`.
- **Added**: Complex models in `schemas/quiz.py` (`QuizOption`, `AdaptiveQuestion`, `AdaptiveQuizResponse`).
- **Added**: Database operations for syllabus hashing, draft creation, and user proficiency tracking in `database_service.py`.

### [2026-03-19] — Advanced NLP & Security Hardening
- **Added**: `AdvancedNLPCleaner` with 4-stage processing.
- **Added**: Comprehensive test suite in `tests/test_nlp_cleaner.py` (27 tests).
- **Added**: `ContentSizeLimitMiddleware` for payload protection.
- **Modified**: `pdf_service.py` to use the new cleaner class while maintaining backward compatibility.
- **Fixed**: Bug where NFKC normalization failed to map curly quotes to ASCII.
- **Fixed**: Bug where spaces diluted the digit-ratio calculation in the noise filter.

---

## 📓 My Notes & Future Tasks
*(Add your personal notes or upcoming ideas here)*

- [x] Implement database persistence for extracted syllabus data.
- [ ] Add user authentication (Supabase integration).
- [ ] Optimize the subject splitting regex for stronger robustness.
- [ ] Connect proficiency updates to frontend analytics dashboard.
