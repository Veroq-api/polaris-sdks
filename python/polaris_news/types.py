from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class Source:
    name: str = ""
    url: str = ""
    trust_level: Optional[str] = None
    verified: Optional[bool] = None


@dataclass
class Entity:
    name: str = ""
    type: Optional[str] = None
    sentiment: Optional[str] = None
    mention_count: Optional[int] = None
    ticker: Optional[str] = None
    role: Optional[str] = None


@dataclass
class Provenance:
    review_status: Optional[str] = None
    ai_contribution_pct: Optional[float] = None
    human_contribution_pct: Optional[float] = None
    confidence_score: Optional[float] = None
    bias_score: Optional[float] = None
    agents_involved: Optional[List[str]] = None


@dataclass
class Brief:
    id: Optional[str] = None
    headline: str = ""
    summary: Optional[str] = None
    body: Optional[str] = None
    confidence: Optional[float] = None
    bias_score: Optional[float] = None
    sentiment: Optional[str] = None
    counter_argument: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    sources: Optional[List[Source]] = None
    entities_enriched: Optional[List[Entity]] = None
    structured_data: Optional[Dict[str, Any]] = None
    published_at: Optional[str] = None
    review_status: Optional[str] = None
    provenance: Optional[Provenance] = None
    brief_type: Optional[str] = None
    trending: Optional[bool] = None
    topics: Optional[List[str]] = None
    entities: Optional[List[str]] = None
    impact_score: Optional[float] = None
    read_time_seconds: Optional[int] = None
    source_count: Optional[int] = None
    corrections_count: Optional[int] = None
    bias_analysis: Optional[Dict[str, Any]] = None
    full_sources: Optional[List[Dict[str, Any]]] = None


@dataclass
class FeedResponse:
    briefs: List[Brief] = field(default_factory=list)
    total: int = 0
    page: int = 1
    per_page: int = 20
    generated_at: Optional[str] = None
    agent_version: Optional[str] = None
    sources_scanned_24h: Optional[int] = None


@dataclass
class DepthMetadata:
    depth: Optional[str] = None
    search_ms: Optional[int] = None
    cross_ref_ms: Optional[int] = None
    verification_ms: Optional[int] = None
    total_ms: Optional[int] = None


@dataclass
class EntityCrossRef:
    brief_id: Optional[str] = None
    headline: Optional[str] = None
    published_at: Optional[str] = None


@dataclass
class SourceVerification:
    checked: int = 0
    accessible: int = 0
    inaccessible: int = 0


@dataclass
class SearchResponse:
    briefs: List[Brief] = field(default_factory=list)
    total: int = 0
    facets: Optional[Dict[str, Any]] = None
    related_queries: Optional[List[str]] = None
    did_you_mean: Optional[str] = None
    took_ms: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None
    depth_metadata: Optional[DepthMetadata] = None


@dataclass
class ExtractResult:
    url: str = ""
    title: Optional[str] = None
    text: Optional[str] = None
    word_count: Optional[int] = None
    language: Optional[str] = None
    published_date: Optional[str] = None
    domain: Optional[str] = None
    success: bool = False
    error: Optional[str] = None


@dataclass
class ExtractResponse:
    results: List[ExtractResult] = field(default_factory=list)
    credits_used: int = 0


@dataclass
class Cluster:
    cluster_id: Optional[str] = None
    topic: str = ""
    brief_count: int = 0
    categories: Optional[List[str]] = None
    briefs: Optional[List[Brief]] = None
    latest: Optional[str] = None


@dataclass
class ClustersResponse:
    clusters: List[Cluster] = field(default_factory=list)
    period: Optional[str] = None


@dataclass
class DataPointValue:
    type: Optional[str] = None
    value: Optional[Any] = None
    context: Optional[str] = None
    entity: Optional[str] = None


@dataclass
class DataPoint:
    brief_id: Optional[str] = None
    headline: Optional[str] = None
    data_point: Optional[DataPointValue] = None
    published_at: Optional[str] = None


@dataclass
class DataResponse:
    data: List[DataPoint] = field(default_factory=list)


@dataclass
class EntitiesResponse:
    entities: List[Entity] = field(default_factory=list)


@dataclass
class SourceAnalysis:
    source: Optional[str] = None
    url: Optional[str] = None
    summary: Optional[str] = None
    bias: Optional[str] = None
    trust_level: Optional[str] = None


@dataclass
class ComparisonResponse:
    topic: Optional[str] = None
    share_id: Optional[str] = None
    polaris_brief: Optional[Brief] = None
    source_analyses: Optional[List[SourceAnalysis]] = None
    polaris_analysis: Optional[str] = None
    generated_at: Optional[str] = None


def _parse_source(data):
    if isinstance(data, dict):
        return Source(**{k: v for k, v in data.items() if k in Source.__dataclass_fields__})
    return Source()


def _parse_entity(data):
    if isinstance(data, dict):
        return Entity(**{k: v for k, v in data.items() if k in Entity.__dataclass_fields__})
    return Entity()


def _parse_provenance(data):
    if isinstance(data, dict):
        return Provenance(**{k: v for k, v in data.items() if k in Provenance.__dataclass_fields__})
    return None


def _parse_brief(data):
    if not isinstance(data, dict):
        return Brief()
    fields = {}
    for k, v in data.items():
        if k not in Brief.__dataclass_fields__:
            continue
        if k == "sources" and isinstance(v, list):
            fields[k] = [_parse_source(s) for s in v]
        elif k == "entities_enriched" and isinstance(v, list):
            fields[k] = [_parse_entity(e) for e in v]
        elif k == "provenance" and isinstance(v, dict):
            fields[k] = _parse_provenance(v)
        else:
            fields[k] = v
    return Brief(**fields)


def _parse_data_point_value(data):
    if isinstance(data, dict):
        return DataPointValue(**{k: v for k, v in data.items() if k in DataPointValue.__dataclass_fields__})
    return None


def _parse_data_point(data):
    if not isinstance(data, dict):
        return DataPoint()
    fields = {}
    for k, v in data.items():
        if k not in DataPoint.__dataclass_fields__:
            continue
        if k == "data_point" and isinstance(v, dict):
            fields[k] = _parse_data_point_value(v)
        else:
            fields[k] = v
    return DataPoint(**fields)


def _parse_cluster(data):
    if not isinstance(data, dict):
        return Cluster()
    fields = {}
    for k, v in data.items():
        if k not in Cluster.__dataclass_fields__:
            continue
        if k == "briefs" and isinstance(v, list):
            fields[k] = [_parse_brief(b) for b in v]
        else:
            fields[k] = v
    return Cluster(**fields)


def _parse_source_analysis(data):
    if isinstance(data, dict):
        return SourceAnalysis(**{k: v for k, v in data.items() if k in SourceAnalysis.__dataclass_fields__})
    return SourceAnalysis()


def _parse_depth_metadata(data):
    if isinstance(data, dict):
        return DepthMetadata(**{k: v for k, v in data.items() if k in DepthMetadata.__dataclass_fields__})
    return None


def _parse_extract_result(data):
    if isinstance(data, dict):
        return ExtractResult(**{k: v for k, v in data.items() if k in ExtractResult.__dataclass_fields__})
    return ExtractResult()
