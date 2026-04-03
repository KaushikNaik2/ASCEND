import io
import re
import unicodedata
import pdfplumber
import hashlib

# ---------------------------------------------------------------------------
# Stage 0 — Security & Fingerprinting
# ---------------------------------------------------------------------------
def calculate_file_hash(file_bytes: bytes) -> str:
    """
    Generates a unique SHA-256 fingerprint for the PDF.
    Used to check if a syllabus already exists in the 'Golden Vault' 
    to prevent redundant LLM costs.
    """
    return hashlib.sha256(file_bytes).hexdigest()

# ---------------------------------------------------------------------------
# Stage 1 — Unicode Normalization
# ---------------------------------------------------------------------------
_ZERO_WIDTH_CHARS = re.compile(
    r'[\u200b\u200c\u200d\u00ad\ufeff\u2060\u180e]'
)

_DASH_VARIANTS = re.compile(r'[\u2013\u2014\u2015]')
_EXOTIC_SPACES = re.compile(r'[\xa0\u2002\u2003\u2009\u200a\u202f\u3000]')

_CURLY_QUOTES = str.maketrans({
    '\u201c': '"', '\u201d': '"',
    '\u2018': "'", '\u2019': "'",
    '\u201a': "'", '\u201e': '"',
    '\u00ab': '"', '\u00bb': '"',
    '\u2039': "'", '\u203a': "'",
})

def _unicode_normalize(text: str) -> str:
    """Collapses ligatures, fullwidth chars, and exotic punctuation."""
    text = unicodedata.normalize("NFKC", text)
    text = text.translate(_CURLY_QUOTES)
    text = _ZERO_WIDTH_CHARS.sub('', text)
    text = _DASH_VARIANTS.sub('-', text)
    text = _EXOTIC_SPACES.sub(' ', text)
    return text

# ---------------------------------------------------------------------------
# Stage 2 — Structural Regex Cleanup
# ---------------------------------------------------------------------------
_HYPHEN_LINEBREAK   = re.compile(r'-\n+')
_PAGE_HEADER        = re.compile(r'(?i)\bpage\s*\d+\s*(of\s*\d+)?\b')
_PAGE_NUMBER_FOOTER = re.compile(r'^\s*-\s*\d+\s*-\s*$', re.MULTILINE)
_REPEATED_PUNCT     = re.compile(r'([.\-*_=|~])\1{3,}')
_INLINE_SPACES      = re.compile(r'[ \t]+')
_EXCESS_NEWLINES    = re.compile(r'\n{3,}')

def _structural_cleanup(text: str) -> str:
    """Removes PDF formatting artifacts like headers and repeated dots."""
    text = _HYPHEN_LINEBREAK.sub('', text)
    text = _PAGE_HEADER.sub('', text)
    text = _PAGE_NUMBER_FOOTER.sub('', text)
    text = _REPEATED_PUNCT.sub('', text)
    text = _INLINE_SPACES.sub(' ', text)
    return text

# ---------------------------------------------------------------------------
# Stage 3 — Statistical Noise Reduction
# ---------------------------------------------------------------------------
_MIN_LINE_LENGTH    = 4
_MAX_DIGIT_RATIO    = 0.60
_ALL_CAPS_MIN_WORDS = 3

def _is_junk_line(line: str) -> bool:
    """Heuristic filter for lines that carry no semantic value."""
    stripped = line.strip()
    if not stripped:
        return False

    if len(stripped) < _MIN_LINE_LENGTH:
        return True

    non_ws = stripped.replace(' ', '').replace('\t', '')
    if non_ws and sum(c.isdigit() for c in non_ws) / len(non_ws) > _MAX_DIGIT_RATIO:
        return True

    words = stripped.split()
    if stripped.isupper() and len(words) < _ALL_CAPS_MIN_WORDS:
        return True

    return False

def _statistical_filter(text: str) -> str:
    """Filters lines identified as statistical noise (e.g., table headers)."""
    lines = text.split('\n')
    kept  = [line for line in lines if not _is_junk_line(line)]
    return '\n'.join(kept)

# ---------------------------------------------------------------------------
# Stage 4 — Markdown Structure Injection
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
# Stage 5 — Final Normalization
# ---------------------------------------------------------------------------
def _final_collapse(text: str) -> str:
    """Collapses multi-blank lines and trims outer whitespace."""
    text = _EXCESS_NEWLINES.sub('\n\n', text)
    return text.strip()

# ---------------------------------------------------------------------------
# Public API — AdvancedNLPCleaner
# ---------------------------------------------------------------------------
class AdvancedNLPCleaner:
    """A 5-stage NLP pipeline to prepare PDF text for LLM inference."""

    @staticmethod
    def clean(raw_text: str) -> str:
        text = _unicode_normalize(raw_text)       # Stage 1: Unicode fix
        text = _structural_cleanup(text)          # Stage 2: Artifact removal
        text = _statistical_filter(text)          # Stage 3: Noise reduction
        text = _apply_markdown_structure(text)    # Stage 4: Markdown injection
        text = _final_collapse(text)              # Stage 5: Final Normalization
        return text

# ---------------------------------------------------------------------------
# Public Utility Functions
# ---------------------------------------------------------------------------
def clean_pdf_text(raw_text: str) -> str:
    return AdvancedNLPCleaner.clean(raw_text)

async def extract_and_clean_pdf(file_bytes: bytes) -> str:
    """Reads PDF bytes and returns the finalized clean string."""
    full_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    return clean_pdf_text(full_text)

def split_into_subjects(clean_text: str) -> list:
    """Splits text into chunks based on subject markers."""
    delimiter_pattern = r'(?i)(?=Course\s+Code|Subject\s+Code|Teaching\s+Scheme)'
    raw_chunks  = re.split(delimiter_pattern, clean_text)
    valid_chunks = [chunk.strip() for chunk in raw_chunks if len(chunk.strip()) > 800]

    if not valid_chunks:
        return [clean_text]

    return valid_chunks