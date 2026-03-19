# backend/tests/test_nlp_cleaner.py

import sys
import os

# Make the backend package importable when running from backend/ dir
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.pdf_service import (
    AdvancedNLPCleaner,
    _unicode_normalize,
    _structural_cleanup,
    _statistical_filter,
    _is_junk_line,
    _final_collapse,
    clean_pdf_text,
)


# ===========================================================================
# Stage 1 — Unicode Normalization
# ===========================================================================

def test_ligature_fi_normalization():
    """ﬁ (U+FB01 LATIN SMALL LIGATURE FI) must expand to 'fi'."""
    assert _unicode_normalize("ﬁnal exam") == "final exam"

def test_ligature_ff_normalization():
    """ﬀ (U+FB00 LATIN SMALL LIGATURE FF) must expand to 'ff'."""
    assert _unicode_normalize("ﬀective") == "ffective"

def test_fancy_double_quotes_normalized():
    """\u201c and \u201d (curly quotes) must become ASCII quotation marks."""
    assert _unicode_normalize("\u201cHello\u201d") == '"Hello"'

def test_fancy_single_quotes_normalized():
    """\u2018 and \u2019 (curly apostrophes) must become ASCII apostrophes."""
    assert _unicode_normalize("it\u2019s") == "it's"

def test_zero_width_chars_removed():
    """Zero-width space (U+200B) must be silently stripped."""
    assert _unicode_normalize("hel\u200blo") == "hello"

def test_soft_hyphen_removed():
    """Soft hyphen (U+00AD) used for optional line-breaking must be removed."""
    assert _unicode_normalize("syl\u00adlable") == "syllable"

def test_em_dash_becomes_hyphen():
    """Em-dash (—) must be normalised to a plain hyphen."""
    assert _unicode_normalize("cause\u2014effect") == "cause-effect"

def test_en_dash_becomes_hyphen():
    """En-dash (–) must be normalised to a plain hyphen."""
    assert _unicode_normalize("2019\u20132020") == "2019-2020"

def test_non_breaking_space_becomes_space():
    """Non-breaking space (\\xa0) must become a regular space."""
    assert _unicode_normalize("hello\xa0world") == "hello world"

def test_fullwidth_digits_collapsed():
    """Fullwidth digit '１' (U+FF11) must collapse to ASCII '1'."""
    assert _unicode_normalize("Unit\uff111") == "Unit11"


# ===========================================================================
# Stage 2 — Structural Regex Cleanup
# ===========================================================================

def test_page_header_removed():
    """'Page 3 of 10' style headers must be stripped."""
    assert "Page" not in _structural_cleanup("introduction\nPage 3 of 10\ncontent")

def test_page_number_footer_removed():
    """Centred page numbers like '- 12 -' must be stripped."""
    result = _structural_cleanup("end of section\n- 12 -\nnext section")
    assert "- 12 -" not in result

def test_hyphenated_linebreak_rejoined():
    """A word split across lines with a trailing hyphen must be rejoined."""
    result = _structural_cleanup("hy-\nphens")
    assert "hy-\n" not in result

def test_repeated_dots_removed():
    """Four or more repeated dots like '......' must be removed."""
    result = _structural_cleanup("Table of contents......page 5")
    assert "......" not in result

def test_repeated_dashes_removed():
    """Four or more repeated dashes like '------' must be removed."""
    result = _structural_cleanup("Section A ------")
    assert "------" not in result

def test_multiple_inline_spaces_collapsed():
    """Multiple consecutive spaces / tabs must collapse to a single space."""
    result = _structural_cleanup("hello   \t  world")
    assert result == "hello world"


# ===========================================================================
# Stage 3 — Statistical Noise Reduction
# ===========================================================================

def test_short_line_is_junk():
    """A line with fewer than 4 characters is junk."""
    assert _is_junk_line("A.") is True

def test_high_digit_ratio_is_junk():
    """A line that is >60 % digits (e.g. a raw mark sheet row) is junk."""
    assert _is_junk_line("1 2 3 4 5 6 7 8") is True

def test_short_allcaps_line_is_junk():
    """An all-uppercase line with fewer than 3 words is a decorative divider."""
    assert _is_junk_line("SR NO") is True

def test_meaningful_allcaps_line_kept():
    """A legitimate ALL-CAPS heading with 3+ words must NOT be filtered."""
    assert _is_junk_line("INTRODUCTION TO MACHINE LEARNING") is False

def test_blank_line_not_junk():
    """Blank lines are handled by Stage 4, not Stage 3."""
    assert _is_junk_line("") is False
    assert _is_junk_line("   ") is False

def test_normal_text_not_junk():
    """Regular academic text must always be preserved."""
    line = "This module covers the fundamentals of data structures."
    assert _is_junk_line(line) is False

def test_statistical_filter_removes_only_noise():
    """Multi-line text: noise lines dropped, content lines kept."""
    raw = "Real syllabus content\n12\n1 2 3 4 5 6 7 8 9\nMore content here"
    result = _statistical_filter(raw)
    assert "Real syllabus content" in result
    assert "More content here" in result
    assert "1 2 3 4 5 6 7 8 9" not in result


# ===========================================================================
# Stage 4 — Final Collapse & Trim
# ===========================================================================

def test_excess_blank_lines_collapsed():
    """Four consecutive newlines must collapse to two."""
    result = _final_collapse("para1\n\n\n\npara2")
    assert result == "para1\n\npara2"

def test_leading_trailing_whitespace_stripped():
    """Leading/trailing whitespace must be removed."""
    assert _final_collapse("  hello  ") == "hello"


# ===========================================================================
# End-to-End Pipeline
# ===========================================================================

def test_full_pipeline_clean_text_preserved():
    """A well-formed academic paragraph must survive the full pipeline intact."""
    text = (
        "Data Structures and Algorithms covers arrays, linked lists, "
        "trees, graphs, sorting and searching algorithms."
    )
    assert AdvancedNLPCleaner.clean(text) == text

def test_full_pipeline_combined_noise():
    """A noisy string must come out clean end-to-end."""
    noisy = "Chapter 1\u200b\nPage 2 of 30\n1 2 3 4 5 6 7 8\nReal content here."
    result = clean_pdf_text(noisy)
    assert "Real content here." in result
    assert "\u200b" not in result  # zero-width removed
    assert "Page 2 of 30" not in result  # page header removed
    assert "1 2 3 4 5 6 7 8" not in result  # number dump removed
