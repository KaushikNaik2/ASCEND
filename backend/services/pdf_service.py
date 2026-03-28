import io
import re
import unicodedata
import pdfplumber

# ---------------------------------------------------------------------------
# Stage 1 — Unicode Normalization
# ---------------------------------------------------------------------------
# Zero-width and invisible characters that bloat token counts silently
_ZERO_WIDTH_CHARS = re.compile(
    r'[\u200b\u200c\u200d\u00ad\ufeff\u2060\u180e]'
)

# Em-dash (—), en-dash (–), horizontal bar (―) → plain hyphen
_DASH_VARIANTS = re.compile(r'[\u2013\u2014\u2015]')

# Non-breaking and exotic whitespace variants → regular space
_EXOTIC_SPACES = re.compile(r'[\xa0\u2002\u2003\u2009\u200a\u202f\u3000]')

# Curly / typographic quotes → plain ASCII equivalents
# NFKC does NOT remap these; they require an explicit pass.
_CURLY_QUOTES = str.maketrans({
    '\u201c': '"', '\u201d': '"',   # “” → "
    '\u2018': "'", '\u2019': "'",   # ‘’ → '
    '\u201a': "'", '\u201e': '"',   # ‚„ → ' "
    '\u00ab': '"', '\u00bb': '"',   # «» → "
    '\u2039': "'", '\u203a': "'",   # ‹› → '
})

def _unicode_normalize(text: str) -> str:
    """
    NFKC normalization collapses ligatures, fullwidth chars, superscripts.
    Followed by explicit passes for chars NFKC does NOT remap:
      - Curly quotes      \u201c\u201d\u2018\u2019  \u2192  " '
      - Zero-width chars  stripped
      - Dash variants     \u2013 \u2014  \u2192  -
      - Exotic whitespace \u00a0 etc.  \u2192 space
    """
    text = unicodedata.normalize("NFKC", text)
    text = text.translate(_CURLY_QUOTES)   # curly quotes NFKC won't touch
    text = _ZERO_WIDTH_CHARS.sub('', text)
    text = _DASH_VARIANTS.sub('-', text)
    text = _EXOTIC_SPACES.sub(' ', text)
    return text

# ---------------------------------------------------------------------------
# Stage 2 — Structural Regex Cleanup (upgraded from original 5-regex set)
# ---------------------------------------------------------------------------
_HYPHEN_LINEBREAK   = re.compile(r'-\n+')
_PAGE_HEADER        = re.compile(r'(?i)\bpage\s*\d+\s*(of\s*\d+)?\b')
_PAGE_NUMBER_FOOTER = re.compile(r'^\s*-\s*\d+\s*-\s*$', re.MULTILINE)
_REPEATED_PUNCT     = re.compile(r'([.\-*_=|~])\1{3,}')   # ...., ----, ====
_INLINE_SPACES      = re.compile(r'[ \t]+')
_EXCESS_NEWLINES    = re.compile(r'\n{3,}')

def _structural_cleanup(text: str) -> str:
    """Removes PDF formatting artifacts with an upgraded regex pass."""
    text = _HYPHEN_LINEBREAK.sub('', text)        # word- \n ➜  word
    text = _PAGE_HEADER.sub('', text)             # "Page 3 of 10"
    text = _PAGE_NUMBER_FOOTER.sub('', text)      # "- 12 -"
    text = _REPEATED_PUNCT.sub('', text)          # "......", "======"
    text = _INLINE_SPACES.sub(' ', text)          # multiple spaces/tabs
    return text

# ---------------------------------------------------------------------------
# Stage 3 — Statistical Noise Reduction
# ---------------------------------------------------------------------------
_MIN_LINE_LENGTH    = 4      # chars — shorter lines are stray punctuation
_MAX_DIGIT_RATIO    = 0.60   # lines > 60 % digits = raw table dump
_ALL_CAPS_MIN_WORDS = 3      # ALL-CAPS lines with fewer words = decorative divider

def _is_junk_line(line: str) -> bool:
    """
    Returns True if the line is statistical noise that should be discarded.

    Three heuristics:
      1. Length filter  — lines < 4 chars carry no semantic value.
      2. Digit ratio    — raw number tables (e.g. mark sheets, serial runs)
                          contain > 60 % digit characters.
      3. ALL-CAPS short — decorative section dividers like "SR NO MARKS GRADE"
                          that are all-uppercase and less than 3 words.
    """
    stripped = line.strip()
    if not stripped:
        return False  # blank lines are handled by Stage 2

    # Heuristic 1: too short
    if len(stripped) < _MIN_LINE_LENGTH:
        return True

    # Heuristic 2: high digit ratio
    # Computed over non-whitespace chars so spaced number dumps like
    # "1 2 3 4 5 6" aren't diluted by spaces and slip through the filter.
    non_ws = stripped.replace(' ', '').replace('\t', '')
    if non_ws and sum(c.isdigit() for c in non_ws) / len(non_ws) > _MAX_DIGIT_RATIO:
        return True

    # Heuristic 3: short ALL-CAPS decorative divider
    words = stripped.split()
    if stripped.isupper() and len(words) < _ALL_CAPS_MIN_WORDS:
        return True

    return False

def _statistical_filter(text: str) -> str:
    """Filters lines identified as statistical noise."""
    lines = text.split('\n')
    kept  = [line for line in lines if not _is_junk_line(line)]
    return '\n'.join(kept)

# ---------------------------------------------------------------------------
# Stage 4 — Final Collapse & Trim
# ---------------------------------------------------------------------------
def _final_collapse(text: str) -> str:
    """Collapses remaining multi-blank lines and trims outer whitespace."""
    text = _EXCESS_NEWLINES.sub('\n\n', text)
    return text.strip()

# ---------------------------------------------------------------------------
# Stage 5 — Markdown Structure Injection
# ---------------------------------------------------------------------------
def _apply_markdown_structure(text: str) -> str:
    """Converts syllabus structural markers into token-efficient Markdown."""
    # 1. Main Headers -> H1
    text = re.sub(r'(?i)^(Course Code|Subject Code|Teaching Scheme)', r'# \1', text, flags=re.MULTILINE)
    
    # 2. Module/Unit Headers -> H2
    text = re.sub(r'(?i)^(Module\s*\d+|Unit\s*[IVX]+)', r'## \1', text, flags=re.MULTILINE)
    
    # 3. List Items -> Unordered Markdown Lists
    text = re.sub(r'^\s*(\d+\.|[a-z]\))\s+', r'- ', text, flags=re.MULTILINE)
    
    return text

# ---------------------------------------------------------------------------
# Public API — AdvancedNLPCleaner
# ---------------------------------------------------------------------------
class AdvancedNLPCleaner:
    """
    A 4-stage NLP pipeline that sanitizes raw PDF text before it is sent
    to Gemini.  Designed to maximally protect the context window by removing:

      Stage 1 — Unicode artifacts   (ligatures, fancy quotes, invisible chars)
      Stage 2 — Structural noise    (page headers/footers, repeated punctuation)
      Stage 3 — Statistical noise   (number dumps, stray chars, ALL-CAPS dividers)
      Stage 4 — Final normalisation (excess blank lines, surrounding whitespace)
      Stage 5 — Markdown Structure Injection (converts syllabus structural markers into token-efficient Markdown)
    """

    @staticmethod
    def clean(raw_text: str) -> str:
        text = _unicode_normalize(raw_text)       # Stage 1: Fix broken PDF characters
        text = _structural_cleanup(text)          # Stage 2: Remove headers/footers
        text = _statistical_filter(text)          # Stage 3: Drop table noise
        text = _apply_markdown_structure(text)    # Stage 4: Token-efficient MD injection
        text = _final_collapse(text)              # Stage 5: Sweep up spacing artifacts
        return text

# ---------------------------------------------------------------------------
# Module-level convenience wrapper (keeps backward compatibility)
# ---------------------------------------------------------------------------
def clean_pdf_text(raw_text: str) -> str:
    """Sanitizes raw PDF text using the AdvancedNLPCleaner pipeline."""
    return AdvancedNLPCleaner.clean(raw_text)


# ---------------------------------------------------------------------------
# Async PDF extraction (unchanged pipeline integration)
# ---------------------------------------------------------------------------
async def extract_and_clean_pdf(file_bytes: bytes) -> str:
    """Reads PDF bytes, extracts text, and returns the cleaned string."""
    full_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    return clean_pdf_text(full_text)


# ---------------------------------------------------------------------------
# Subject splitter (unchanged)
# ---------------------------------------------------------------------------
def split_into_subjects(clean_text: str) -> list:
    """
    Splits the semester PDF into individual subject chunks to prevent
    LLM token truncation.
    """
    delimiter_pattern = r'(?i)(?=Course\s+Code|Subject\s+Code|Teaching\s+Scheme)'
    raw_chunks  = re.split(delimiter_pattern, clean_text)
    valid_chunks = [chunk.strip() for chunk in raw_chunks if len(chunk.strip()) > 800]

    if not valid_chunks:
        print("⚠️  Warning: Delimiter not found. Processing entire PDF as one chunk.")
        return [clean_text]

    print(f"✂️  Successfully split PDF into {len(valid_chunks)} subject chunks.")
    return valid_chunks