# backend/services/embedding_service.py

import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class EmbeddingEngine:
    """
    Singleton service to generate 768-dimensional vectors.
    Uses Google's text-embedding-004.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingEngine, cls).__new__(cls)
            
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("🚨 GOOGLE_API_KEY missing for EmbeddingEngine")
                
            # We use models/embedding-001 for universal compatibility
            cls._instance.model = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-001",
                google_api_key=api_key
            )
        return cls._instance

    async def get_embedding(self, text: str) -> list[float]:
        """Converts a single string into a vector."""
        return await self.model.aembed_query(text)

    async def get_batch_embeddings(self, texts: list[str]) -> list[list[float]]:
        """Embeds multiple items efficiently."""
        return await self.model.aembed_documents(texts)

# Export singleton instance
embedder = EmbeddingEngine()