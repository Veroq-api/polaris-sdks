# polaris-news (DEPRECATED)

> **This package has been renamed to `veroq`.** Please install the new package instead:
>
> ```bash
> pip install veroq
> ```
>
> The `veroq` package is fully backwards compatible. All class names work unchanged, and both `VEROQ_API_KEY` and `POLARIS_API_KEY` environment variables are supported.

---

## Migration

```diff
- pip install polaris-news
+ pip install veroq

- from polaris_news import PolarisClient
+ from veroq import VeroqClient  # or: from veroq import PolarisClient (alias)

- from polaris_news import Agent
+ from veroq import Agent
```

## Previous Documentation

For full documentation, see the [veroq package on PyPI](https://pypi.org/project/veroq/).
