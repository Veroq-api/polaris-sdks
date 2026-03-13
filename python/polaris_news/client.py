import json

import requests

from .exceptions import APIError, AuthenticationError, NotFoundError, PolarisError, RateLimitError
from .types import (
    Brief,
    ClustersResponse,
    ComparisonResponse,
    DataResponse,
    EntitiesResponse,
    ExtractResponse,
    FeedResponse,
    SearchResponse,
    _parse_brief,
    _parse_cluster,
    _parse_data_point,
    _parse_depth_metadata,
    _parse_entity,
    _parse_extract_result,
    _parse_source_analysis,
)


class PolarisClient:
    """Client for The Polaris Report API."""

    DEFAULT_BASE_URL = "https://api.thepolarisreport.com"

    def __init__(self, api_key=None, base_url=None):
        self.api_key = api_key
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self._session = requests.Session()
        if self.api_key:
            self._session.headers["Authorization"] = "Bearer {}".format(self.api_key)

    def _request(self, method, path, params=None, json_body=None):
        url = "{}{}".format(self.base_url, path)
        resp = self._session.request(method, url, params=params, json=json_body)
        if resp.status_code >= 400:
            self._raise_error(resp)
        return resp.json()

    def _raise_error(self, resp):
        try:
            body = resp.json()
        except Exception:
            body = resp.text

        msg = body.get("error", resp.text) if isinstance(body, dict) else resp.text

        if resp.status_code == 401:
            raise AuthenticationError(msg, status_code=401, response_body=body)
        elif resp.status_code == 404:
            raise NotFoundError(msg, status_code=404, response_body=body)
        elif resp.status_code == 429:
            retry_after = resp.headers.get("Retry-After") or resp.headers.get("RateLimit-Reset")
            if retry_after is not None:
                try:
                    retry_after = int(retry_after)
                except (ValueError, TypeError):
                    pass
            raise RateLimitError(msg, status_code=429, response_body=body, retry_after=retry_after)
        else:
            raise APIError(msg, status_code=resp.status_code, response_body=body)

    def feed(self, category=None, limit=None, page=None, per_page=None, min_confidence=None,
             include_sources=None, exclude_sources=None):
        """Get the news feed."""
        params = {}
        if category is not None:
            params["category"] = category
        if limit is not None:
            params["per_page"] = limit
        if page is not None:
            params["page"] = page
        if per_page is not None:
            params["per_page"] = per_page
        if min_confidence is not None:
            params["min_confidence"] = min_confidence
        if include_sources is not None:
            params["include_sources"] = include_sources
        if exclude_sources is not None:
            params["exclude_sources"] = exclude_sources
        data = self._request("GET", "/api/v1/feed", params=params)
        return FeedResponse(
            briefs=[_parse_brief(b) for b in data.get("briefs", [])],
            total=data.get("total", 0),
            page=data.get("page", 1),
            per_page=data.get("per_page", 20),
            generated_at=data.get("generated_at"),
            agent_version=data.get("agent_version"),
            sources_scanned_24h=data.get("sources_scanned_24h"),
        )

    def brief(self, brief_id, include_full_text=None):
        """Get a single brief by ID."""
        params = {}
        if include_full_text is not None:
            params["include_full_text"] = str(include_full_text).lower()
        data = self._request("GET", "/api/v1/brief/{}".format(brief_id), params=params)
        return _parse_brief(data.get("brief", data))

    def search(self, query, category=None, page=None, per_page=None, sort=None,
               min_confidence=None, from_date=None, to_date=None, entity=None, sentiment=None,
               depth=None, include_sources=None, exclude_sources=None):
        """Search briefs."""
        params = {"q": query}
        if category is not None:
            params["category"] = category
        if page is not None:
            params["page"] = page
        if per_page is not None:
            params["per_page"] = per_page
        if sort is not None:
            params["sort"] = sort
        if min_confidence is not None:
            params["min_confidence"] = min_confidence
        if from_date is not None:
            params["from"] = from_date
        if to_date is not None:
            params["to"] = to_date
        if entity is not None:
            params["entity"] = entity
        if sentiment is not None:
            params["sentiment"] = sentiment
        if depth is not None:
            params["depth"] = depth
        if include_sources is not None:
            params["include_sources"] = include_sources
        if exclude_sources is not None:
            params["exclude_sources"] = exclude_sources
        data = self._request("GET", "/api/v1/search", params=params)
        return SearchResponse(
            briefs=[_parse_brief(b) for b in data.get("briefs", [])],
            total=data.get("total", 0),
            facets=data.get("facets"),
            related_queries=data.get("related_queries"),
            did_you_mean=data.get("did_you_mean"),
            took_ms=data.get("took_ms"),
            meta=data.get("meta"),
            depth_metadata=_parse_depth_metadata(data.get("depth_metadata")),
        )

    def generate(self, topic, category=None):
        """Generate a brief on a given topic."""
        body = {"topic": topic}
        if category is not None:
            body["category"] = category
        data = self._request("POST", "/api/v1/generate/brief", json_body=body)
        return _parse_brief(data.get("brief", data))

    def entities(self, q=None, type=None, limit=None):
        """List entities."""
        params = {}
        if q is not None:
            params["q"] = q
        if type is not None:
            params["type"] = type
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/entities", params=params)
        return EntitiesResponse(
            entities=[_parse_entity(e) for e in data.get("entities", [])],
        )

    def entity_briefs(self, name, role=None, limit=None, offset=None):
        """Get briefs for a specific entity."""
        params = {}
        if role is not None:
            params["role"] = role
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset
        data = self._request("GET", "/api/v1/entities/{}/briefs".format(name), params=params)
        return [_parse_brief(b) for b in data.get("briefs", [])]

    def trending_entities(self, limit=None):
        """Get trending entities."""
        params = {}
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/entities/trending", params=params)
        return [_parse_entity(e) for e in data.get("entities", [])]

    def similar(self, brief_id, limit=None):
        """Get similar briefs."""
        params = {}
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/similar/{}".format(brief_id), params=params)
        return [_parse_brief(b) for b in data.get("briefs", [])]

    def clusters(self, period=None, limit=None):
        """Get brief clusters."""
        params = {}
        if period is not None:
            params["period"] = period
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/clusters", params=params)
        return ClustersResponse(
            clusters=[_parse_cluster(c) for c in data.get("clusters", [])],
            period=data.get("period"),
        )

    def data(self, entity=None, type=None, limit=None):
        """Get structured data points."""
        params = {}
        if entity is not None:
            params["entity"] = entity
        if type is not None:
            params["type"] = type
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/data", params=params)
        return DataResponse(
            data=[_parse_data_point(d) for d in data.get("data", [])],
        )

    def agent_feed(self, category=None, tags=None, limit=None, min_confidence=None,
                   include_sources=None, exclude_sources=None):
        """Get the agent-optimized feed."""
        params = {}
        if category is not None:
            params["category"] = category
        if tags is not None:
            params["tags"] = tags
        if limit is not None:
            params["limit"] = limit
        if min_confidence is not None:
            params["min_confidence"] = min_confidence
        if include_sources is not None:
            params["include_sources"] = include_sources
        if exclude_sources is not None:
            params["exclude_sources"] = exclude_sources
        data = self._request("GET", "/api/v1/agent-feed", params=params)
        return FeedResponse(
            briefs=[_parse_brief(b) for b in data.get("briefs", [])],
            total=data.get("total", 0),
            page=data.get("page", 1),
            per_page=data.get("per_page", 20),
            generated_at=data.get("generated_at"),
            agent_version=data.get("agent_version"),
            sources_scanned_24h=data.get("sources_scanned_24h"),
        )

    def compare_sources(self, brief_id):
        """Compare sources for a brief."""
        params = {"brief_id": brief_id}
        data = self._request("GET", "/api/v1/compare/sources", params=params)
        brief_data = data.get("polaris_brief")
        return ComparisonResponse(
            topic=data.get("topic"),
            share_id=data.get("share_id"),
            polaris_brief=_parse_brief(brief_data) if brief_data else None,
            source_analyses=[_parse_source_analysis(s) for s in data.get("source_analyses", [])],
            polaris_analysis=data.get("polaris_analysis"),
            generated_at=data.get("generated_at"),
        )

    def extract(self, urls, include_metadata=True):
        """Extract clean article content from URLs."""
        body = {"urls": urls, "include_metadata": include_metadata}
        data = self._request("POST", "/api/v1/extract", json_body=body)
        return ExtractResponse(
            results=[_parse_extract_result(r) for r in data.get("results", [])],
            credits_used=data.get("credits_used", 0),
        )

    def trending(self, period=None, limit=None):
        """Get trending briefs."""
        params = {}
        if period is not None:
            params["period"] = period
        if limit is not None:
            params["limit"] = limit
        data = self._request("GET", "/api/v1/trending", params=params)
        return [_parse_brief(b) for b in data.get("briefs", [])]

    def stream(self, categories=None):
        """Stream briefs via SSE. Yields Brief objects.

        Usage:
            for brief in client.stream(categories="technology,science"):
                print(brief.headline)
        """
        params = {}
        if categories is not None:
            params["categories"] = categories
        url = "{}{}".format(self.base_url, "/api/v1/stream")
        resp = self._session.get(url, params=params, stream=True, headers={"Accept": "text/event-stream"})
        if resp.status_code >= 400:
            self._raise_error(resp)
        for line in resp.iter_lines(decode_unicode=True):
            if line and line.startswith("data:"):
                payload = line[5:].strip()
                if payload and payload != "[DONE]":
                    try:
                        data = json.loads(payload)
                        yield _parse_brief(data)
                    except (json.JSONDecodeError, TypeError):
                        continue
