# polaris-news-api

Official TypeScript SDK for [The Polaris Report](https://thepolarisreport.com) API.

## Installation

```bash
npm install polaris-news-api
```

## Quick Start

```typescript
import { PolarisClient } from "polaris-news-api";

const client = new PolarisClient({ apiKey: "your-api-key" });
const feed = await client.feed({ category: "technology", limit: 10 });
feed.briefs.forEach((brief) => console.log(brief.headline));
```

## Methods

| Method | Description |
|--------|-------------|
| `feed(options?)` | Get the news feed |
| `brief(id, options?)` | Get a single brief by ID |
| `search(query, options?)` | Search briefs |
| `generate(topic, category?)` | Generate a brief on a topic |
| `entities(options?)` | List entities |
| `entityBriefs(name, options?)` | Get briefs for an entity |
| `trendingEntities(limit?)` | Get trending entities |
| `similar(id, options?)` | Get similar briefs |
| `clusters(options?)` | Get brief clusters |
| `data(options?)` | Get structured data points |
| `agentFeed(options?)` | Get agent-optimized feed |
| `compareSources(briefId)` | Compare sources for a brief |
| `trending(options?)` | Get trending briefs |
| `stream(options?)` | Stream briefs via SSE |

## Error Handling

```typescript
import { PolarisClient, AuthenticationError, RateLimitError, NotFoundError } from "polaris-news-api";

const client = new PolarisClient({ apiKey: "your-api-key" });

try {
  const brief = await client.brief("abc123");
} catch (e) {
  if (e instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (e instanceof NotFoundError) {
    console.log("Brief not found");
  } else if (e instanceof RateLimitError) {
    console.log(`Rate limited. Retry after: ${e.retryAfter}s`);
  }
}
```

## Streaming

```typescript
const client = new PolarisClient({ apiKey: "your-api-key" });

const stream = client.stream({ categories: "technology,science" });
stream.start(
  (brief) => console.log(`[${brief.category}] ${brief.headline}`),
  (error) => console.error("Stream error:", error)
);

// Later: stream.stop();
```

## Documentation

Full API documentation: https://thepolarisreport.com/docs
