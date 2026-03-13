# Polaris SDKs

Official Python and TypeScript SDKs for [The Polaris Report](https://thepolarisreport.com) API.

## SDKs

| Language | Package | Install |
|----------|---------|---------|
| Python | [`polaris-news`](./python/) | `pip install polaris-news` |
| TypeScript | [`polaris-news-api`](./typescript/) | `npm install polaris-news-api` |

## Quick Start

### Python

```python
from polaris_news import PolarisClient

client = PolarisClient(api_key="your-api-key")
feed = client.feed(category="technology", limit=10)
for brief in feed.briefs:
    print(brief.headline)
```

### TypeScript

```typescript
import { PolarisClient } from "polaris-news-api";

const client = new PolarisClient({ apiKey: "your-api-key" });
const feed = await client.feed({ category: "technology", limit: 10 });
feed.briefs.forEach((brief) => console.log(brief.headline));
```

## Documentation

Full API documentation: https://thepolarisreport.com/docs

## License

MIT
