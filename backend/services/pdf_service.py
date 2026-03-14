import io
import re
import pdfplumber

def clean_pdf_text(raw_text: str) -> str:
    """Sanitizes raw PDF text to reduce token count and improve AI accuracy."""
    text = re.sub(r'-\n+', '', raw_text)
    text = re.sub(r'(?i)\bpage\s*\d+\s*(of\s*\d+)?\b', '', text)
    text = re.sub(r'^\s*-\s*\d+\s*-\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

async def extract_and_clean_pdf(file_bytes: bytes) -> str:
    """Reads PDF bytes, extracts text, and returns the cleaned string."""
    full_text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"
                
    # Clean the extracted text
    return clean_pdf_text(full_text)

def split_into_subjects(clean_text: str) -> list:
    """
    Splits the massive semester PDF into individual subject chunks to prevent LLM token truncation.
    """
    # EXPERT CHECK: You must look at your raw PDF. What phrase always appears right before a new subject begins?
    # For Mumbai University, it is usually "Course Code", "Subject Code", or "Teaching Scheme".
    # The `(?=...)` is a positive lookahead, meaning it splits the text right BEFORE the word, keeping the word in the chunk.
    
    delimiter_pattern = r'(?i)(?=Course\s+Code|Subject\s+Code|Teaching\s+Scheme)'
    
    # Split the document
    raw_chunks = re.split(delimiter_pattern, clean_text)
    
    # Filter out "junk" chunks (like the 2-page index or title page) that are too short to be a real syllabus
    valid_chunks = [chunk.strip() for chunk in raw_chunks if len(chunk.strip()) > 800]
    
    # If the regex didn't trigger, return the whole document as a fallback
    if not valid_chunks:
        print("⚠️ Warning: Delimiter not found. Processing entire PDF as one chunk.")
        return [clean_text]
        
    print(f"✂️ Successfully split PDF into {len(valid_chunks)} subject chunks.")
    return valid_chunks