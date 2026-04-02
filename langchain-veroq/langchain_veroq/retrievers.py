import os
from typing import List, Optional

from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from polaris_news import PolarisClient


def _resolve_api_key(api_key: str = "") -> str:
    """Resolve API key from argument, VEROQ_API_KEY, or POLARIS_API_KEY."""
    if api_key:
        return api_key
    return os.environ.get("VEROQ_API_KEY", "") or os.environ.get("POLARIS_API_KEY", "")


class PolarisRetriever(BaseRetriever):
    """LangChain retriever that searches VEROQ verified intelligence."""

    api_key: str = ""
    category: Optional[str] = None
    min_confidence: Optional[float] = None
    limit: int = 10
    include_sources: Optional[str] = None
    exclude_sources: Optional[str] = None

    def _get_relevant_documents(self, query: str, **kwargs) -> List[Document]:
        client = PolarisClient(api_key=_resolve_api_key(self.api_key))
        search_kwargs = {}
        if self.category is not None:
            search_kwargs["category"] = self.category
        if self.min_confidence is not None:
            search_kwargs["min_confidence"] = self.min_confidence
        if self.include_sources is not None:
            search_kwargs["include_sources"] = self.include_sources
        if self.exclude_sources is not None:
            search_kwargs["exclude_sources"] = self.exclude_sources
        result = client.search(query, per_page=self.limit, **search_kwargs)
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


# Veroq alias
VeroqRetriever = PolarisRetriever
