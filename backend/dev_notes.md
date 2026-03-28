# ASCEND Backend — Developer Notes

This document tracks the technical implementation, architectural decisions, and progress of the ASCEND backend.

---

## 🏗️ Project Architecture

The backend is built with **FastAPI** and uses a service-oriented structure:
- `main.py`: API entry point and routes.
- `core/`: Cross-cutting concerns like security, configuration, and **database management**.
- `services/`: Business logic (PDF processing, LLM orchestration, Supabase interaction).
- `schemas/`: Pydantic models for data validation and structured AI output.
- `tests/`: Unit and integration tests.

### Design Patterns
- **DatabaseManager (Singleton)**: Implemented a central `DatabaseManager` in `core/` to ensure a single Supabase client instance is shared across the application, preventing unnecessary connection overhead.

---

## 🚀 Implemented Features

### 1. Security & Request Validation
- **Content Size Limit**: A custom ASGI middleware (`ContentSizeLimitMiddleware`) enforces a strict **5MB** limit on all incoming requests to prevent memory exhaustion and DoS attacks.
- **PDF Magic Number Check**: The `/upload-syllabus` endpoint reads the first few bytes of uploaded files to verify the `%PDF` signature before processing, ensuring file integrity.
- **CORS Configuration**: Restricted to specific frontend origins (localhost:3000, 5173).

### 2. Advanced DS NLP Cleaner
**Location**: `services/pdf_service.py`
**Why**: Raw PDF text is often filled with formatting "noise" (headers, footers, ligatures) that consumes unnecessary tokens and confuses LLMs.
**Implementation**: A **5-stage** pipeline using `AdvancedNLPCleaner`:
1. **Unicode Normalization**: Collapses ligatures (ﬁ → fi), maps curly quotes to ASCII, and strips zero-width/invisible characters.
2. **Structural Cleanup**: Regex pass to remove "Page X of Y" headers, centered page numbers, and repeated punctuation.
3. **Statistical Noise Reduction**: Filters lines where the digit-to-text ratio is > 60% (likely table data) or line length is < 4 characters.
4. **Markdown Formatting Injection**: Injects markdown hints (headers, bullet points) based on indentation and font size patterns to help the LLM understand document structure with fewer tokens.
5. **Final Collapse**: Standardizes whitespace and newlines.

### 3. PDF Extraction & Subject Splitting
- Uses `pdfplumber` for high-fidelity text extraction.
- **Subject Splitting**: Long semester PDFs are automatically split into individual subject chunks based on Mumbai University patterns (e.g., "Course Code", "Subject Code"). This prevents token truncation and allows parallel/throttled processing.

### 4. Gemini AI Orchestration
**Location**: `services/llm_service.py`
- **Model**: `gemini-3.1-flash-lite-preview` (Fast & Cost-effective).
- **Structured Output**: Uses LangChain's `.with_structured_output()` with Pydantic schemas to ensure Gemini always returns valid JSON.
- **Throttling**: Implements a **4.5-second sleep** between subject chunks to strictly respect the 15 Requests Per Minute (RPM) free-tier limit.

### 5. Database & Persistence (Supabase)
- **Supabase Integration**: Initialized the foundation for Phase 2, enabling cloud persistence for syllabus data.
- **Environment Management**: Added `.env.example` to standardize local environment setup for Supabase credentials.

---

## 📜 Technical Changelog

### [2026-03-29] — Supabase Integration & NLP Evolution
- **Feat**: Initialized Supabase client and `DatabaseManager` singleton for centralized persistence.
- **Feat**: Upgraded `AdvancedNLPCleaner` to a 5-stage pipeline with **Markdown Injection** for better LLM token efficiency.
- **Added**: `.env.example` and updated `.gitignore` to protect secrets while tracking `core/` and `src/lib`.
- **Frontend**: Resolved TypeScript build errors and restructured `src/lib` for shared utilities.
- **Backend**: Added `core/` directory to manage system-level logic.

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

- [x] Implement database persistence for extracted syllabus data (Supabase Initialize).
- [/] Add user authentication (Foundation setup with Supabase).
- [ ] Optimize the subject splitting regex for stronger robustness.

