# backend/services/embedding_service.py

import os
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class EmbeddingEngine:
    """
    Singleton service for 3072-dimensional vectors.
    Uses models/gemini-embedding-2 for maximum semantic precision.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingEngine, cls).__new__(cls)
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("🚨 GOOGLE_API_KEY missing")
                
            # PATH B: Upgrade to text-embedding-004
            cls._instance.model = GoogleGenerativeAIEmbeddings(
                model="models/gemini-embedding-2",
                google_api_key=api_key
            )
        return cls._instance

    async def get_embedding(self, text: str) -> list[float]:
        return await self.model.aembed_query(text)

embedder = EmbeddingEngine()