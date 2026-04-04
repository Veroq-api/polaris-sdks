# @polaris-news/ai

Polaris News tools for the [Vercel AI SDK](https://sdk.vercel.ai). Drop verified news intelligence into any AI SDK agent with one line.

## Install

```bash
npm install @polaris-news/ai polaris-news-api ai zod
```

## Quick Start

```typescript
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { polarisSearch, polarisFeed } from "@polaris-news/ai";

const result = await generateText({
  model: openai("gpt-5.4"),
  tools: {
    searchNews: polarisSearch({ apiKey: "your-api-key" }),
    getLatest: polarisFeed({ apiKey: "your-api-key" }),
  },
  prompt: "What's happening in AI today?",
});
```

If you've run `polaris login` or set `POLARIS_API_KEY`, you can omit the `apiKey` option:

```typescript
const result = await generateText({
  model: openai("gpt-5.4"),
  tools: {
    searchNews: polarisSearch(),
    getLatest: polarisFeed(),
  },
  prompt: "What's happening in AI today?",
});
```

## Tools

| Export | Description |
|--------|------------|
| `polarisSearch()` | Search verified news briefs with confidence scores |
| `polarisFeed()` | Get latest intelligence feed |
| `polarisBrief()` | Get a specific brief by ID |
| `polarisExtract()` | Extract article content from URLs |
| `polarisEntities()` | Look up entity coverage |
| `polarisTrending()` | Get trending entities |
| `polarisCompare()` | Compare outlet coverage of a story |
| `polarisResearch()` | Deep multi-source research (5 credits) |
| `polarisVerify()` | Fact-check a claim against briefs (3 credits) |

Each function accepts an optional `{ apiKey }` config and returns an AI SDK `tool()`.

## License

MIT
