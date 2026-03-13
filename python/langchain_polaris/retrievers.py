from typing import List, Optional

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
from pydantic import Field

from polaris_news import PolarisClient


class PolarisRetriever(BaseRetriever):
    """LangChain retriever that searches Polaris verified news intelligence."""

    api_key: str = Field(description="Polaris API key")
    category: Optional[str] = Field(default=None, description="Category filter")
    min_confidence: Optional[float] = Field(default=None, description="Minimum confidence score")
    limit: int = Field(default=10, description="Max results to return")
    include_sources: Optional[str] = Field(default=None, description="Comma-separated source domains to include")
    exclude_sources: Optional[str] = Field(default=None, description="Comma-separated source domains to exclude")

    def _get_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        client = PolarisClient(api_key=self.api_key)
        result = client.search(
            query,
            category=self.category,
            min_confidence=self.min_confidence,
            per_page=self.limit,
            include_sources=self.include_sources,
            exclude_sources=self.exclude_sources,
        )
        docs = []
        for b in result.briefs:
            content_parts = []
            if b.headline:
                content_parts.append(b.headline)
            if b.summary:
                content_parts.append(b.summary)
            if b.body:
                content_parts.append(b.body)
            page_content = "\n\n".join(content_parts)

            metadata = {
                "brief_id": b.id,
                "confidence": b.confidence,
                "bias_score": b.bias_score,
                "category": b.category,
                "published_at": b.published_at,
                "counter_argument": b.counter_argument,
            }
            if b.sources:
                metadata["sources"] = [{"name": s.name, "url": s.url} for s in b.sources]
            if b.entities_enriched:
                metadata["entities"] = [e.name for e in b.entities_enriched]

            docs.append(Document(page_content=page_content, metadata=metadata))
        return docs
