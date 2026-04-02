__version__ = "0.9.0"

from .client import PolarisClient
from .agent import Agent, AskResult, FullResult, SubscribeEvent
from .exceptions import APIError, AuthenticationError, NotFoundError, PolarisError, RateLimitError
from .types import (
    Brief,
    Cluster,
    ClustersResponse,
    ComparisonResponse,
    DataPoint,
    DataPointValue,
    DataResponse,
    DepthMetadata,
    EntitiesResponse,
    Entity,
    EntityCrossRef,
    ExtractResponse,
    ExtractResult,
    FeedResponse,
    Provenance,
    ResearchEntity,
    ResearchMetadata,
    ResearchResponse,
    ResearchSourceUsed,
    SearchResponse,
    VerifyBrief,
    VerifyResponse,
    Source,
    SourceAnalysis,
    SourceVerification,
)

try:
    from .async_client import AsyncPolarisClient
except ImportError:
    pass

__all__ = [
    "PolarisClient",
    "AsyncPolarisClient",
    "PolarisError",
    "AuthenticationError",
    "RateLimitError",
    "NotFoundError",
    "APIError",
    "Brief",
    "Source",
    "Entity",
    "Provenance",
    "FeedResponse",
    "SearchResponse",
    "Cluster",
    "ClustersResponse",
    "DataPoint",
    "DataPointValue",
    "DataResponse",
    "EntitiesResponse",
    "ComparisonResponse",
    "SourceAnalysis",
    "ExtractResult",
    "ExtractResponse",
    "ResearchResponse",
    "ResearchEntity",
    "ResearchMetadata",
    "ResearchSourceUsed",
    "DepthMetadata",
    "EntityCrossRef",
    "SourceVerification",
    "VerifyBrief",
    "VerifyResponse",
]
