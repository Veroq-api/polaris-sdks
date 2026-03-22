import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

const BASE_URL = 'https://api.thepolarisreport.com';

export class Polaris implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Polaris',
    name: 'polaris',
    icon: 'file:polaris.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with the Polaris Knowledge API',
    defaults: {
      name: 'Polaris',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'polarisApi',
        required: true,
      },
    ],
    properties: [
      // ------ Resource ------
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Briefs', value: 'briefs' },
          { name: 'Crypto', value: 'crypto' },
          { name: 'Intelligence', value: 'intelligence' },
          { name: 'Market Data', value: 'marketData' },
          { name: 'Search', value: 'search' },
          { name: 'Web', value: 'web' },
        ],
        default: 'briefs',
      },

      // ------ Briefs operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['briefs'] } },
        options: [
          { name: 'Get Feed', value: 'getFeed', description: 'Get latest intelligence briefs' },
          { name: 'Get Brief', value: 'getBrief', description: 'Get a specific brief by ID' },
          { name: 'Get Timeline', value: 'getTimeline', description: 'Get timeline for a topic' },
        ],
        default: 'getFeed',
      },

      // ------ Search operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['search'] } },
        options: [
          { name: 'Search', value: 'search', description: 'Search briefs by keyword' },
          { name: 'Suggest', value: 'suggest', description: 'Get search suggestions' },
          { name: 'Web Search', value: 'webSearch', description: 'Search the web' },
        ],
        default: 'search',
      },

      // ------ Intelligence operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['intelligence'] } },
        options: [
          { name: 'Verify', value: 'verify', description: 'Verify a claim' },
          { name: 'Forecast', value: 'forecast', description: 'Generate a forecast' },
          { name: 'Context', value: 'context', description: 'Get contextual analysis' },
        ],
        default: 'verify',
      },

      // ------ Web operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['web'] } },
        options: [
          { name: 'Crawl', value: 'crawl', description: 'Crawl a URL' },
          { name: 'Extract', value: 'extract', description: 'Extract content from a URL' },
        ],
        default: 'crawl',
      },

      // ------ Market Data operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['marketData'] } },
        options: [
          { name: 'Candles', value: 'candles', description: 'Get OHLCV candlestick data for a ticker' },
          { name: 'Commodities', value: 'commodities', description: 'Get commodities data' },
          { name: 'Earnings', value: 'earnings', description: 'Get earnings data for a ticker' },
          { name: 'Economy', value: 'economy', description: 'Get economic indicator data' },
          { name: 'Forex', value: 'forex', description: 'Get foreign exchange rates' },
          { name: 'Market Movers', value: 'marketMovers', description: 'Get top market movers (gainers, losers, active)' },
          { name: 'Market Summary', value: 'marketSummary', description: 'Get overall market summary and indices' },
          { name: 'Technicals', value: 'technicals', description: 'Get technical analysis indicators for a ticker' },
        ],
        default: 'candles',
      },

      // ------ Crypto operations ------
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['crypto'] } },
        options: [
          { name: 'Chart', value: 'cryptoChart', description: 'Get price chart data for a cryptocurrency' },
          { name: 'DeFi', value: 'defi', description: 'Get DeFi protocol data' },
          { name: 'Get Crypto', value: 'crypto', description: 'Get cryptocurrency data' },
          { name: 'Top Cryptos', value: 'cryptoTop', description: 'Get top cryptocurrencies by market cap' },
        ],
        default: 'crypto',
      },

      // ------ Input fields ------

      // Brief ID (for getBrief)
      {
        displayName: 'Brief ID',
        name: 'briefId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['briefs'], operation: ['getBrief'] } },
        description: 'The ID of the brief to retrieve',
      },

      // Query (for search, suggest, webSearch, getTimeline)
      {
        displayName: 'Query',
        name: 'query',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['search', 'suggest', 'webSearch', 'getTimeline'],
          },
        },
        description: 'Search query or topic',
      },

      // Claim (for verify)
      {
        displayName: 'Claim',
        name: 'claim',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['intelligence'], operation: ['verify'] } },
        description: 'The claim to verify',
      },

      // Topic (for forecast, context)
      {
        displayName: 'Topic',
        name: 'topic',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['intelligence'], operation: ['forecast', 'context'] } },
        description: 'The topic to analyze',
      },

      // URL (for crawl, extract)
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { resource: ['web'] } },
        description: 'The URL to process',
      },

      // Limit (optional, multiple operations)
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        default: 10,
        displayOptions: {
          show: {
            operation: ['getFeed', 'search', 'webSearch', 'cryptoTop'],
          },
        },
        description: 'Maximum number of results to return',
      },

      // Depth (for forecast)
      {
        displayName: 'Depth',
        name: 'depth',
        type: 'options',
        options: [
          { name: 'Standard', value: 'standard' },
          { name: 'Deep', value: 'deep' },
        ],
        default: 'standard',
        displayOptions: { show: { resource: ['intelligence'], operation: ['forecast'] } },
        description: 'Analysis depth',
      },

      // Category (for search, getFeed)
      {
        displayName: 'Category',
        name: 'category',
        type: 'string',
        default: '',
        displayOptions: { show: { operation: ['search', 'getFeed'] } },
        description: 'Filter by category',
      },

      // ------ Market Data input fields ------

      // Symbol (for candles, technicals, earnings)
      {
        displayName: 'Symbol',
        name: 'symbol',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            resource: ['marketData'],
            operation: ['candles', 'technicals', 'earnings'],
          },
        },
        description: 'Ticker symbol (e.g. AAPL, MSFT, NVDA)',
      },

      // Interval (for candles)
      {
        displayName: 'Interval',
        name: 'interval',
        type: 'options',
        options: [
          { name: '1 Minute', value: '1m' },
          { name: '5 Minutes', value: '5m' },
          { name: '15 Minutes', value: '15m' },
          { name: '30 Minutes', value: '30m' },
          { name: '1 Hour', value: '1h' },
          { name: '1 Day', value: '1d' },
          { name: '1 Week', value: '1wk' },
          { name: '1 Month', value: '1mo' },
        ],
        default: '1d',
        displayOptions: { show: { resource: ['marketData'], operation: ['candles'] } },
        description: 'Candlestick interval',
      },

      // Range (for candles, technicals)
      {
        displayName: 'Range',
        name: 'range',
        type: 'options',
        options: [
          { name: '1 Day', value: '1d' },
          { name: '5 Days', value: '5d' },
          { name: '1 Month', value: '1mo' },
          { name: '3 Months', value: '3mo' },
          { name: '6 Months', value: '6mo' },
          { name: '1 Year', value: '1y' },
          { name: '5 Years', value: '5y' },
        ],
        default: '1mo',
        displayOptions: { show: { resource: ['marketData'], operation: ['candles', 'technicals'] } },
        description: 'Time range for data',
      },

      // Forex pair (optional)
      {
        displayName: 'Currency Pair',
        name: 'pair',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['marketData'], operation: ['forex'] } },
        description: 'Currency pair (e.g. EURUSD). Leave empty to get all major pairs.',
      },

      // Commodity symbol (optional)
      {
        displayName: 'Commodity Symbol',
        name: 'commoditySymbol',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['marketData'], operation: ['commodities'] } },
        description: 'Commodity symbol (e.g. GC=F for gold). Leave empty to get all commodities.',
      },

      // Economy indicator (optional)
      {
        displayName: 'Indicator',
        name: 'indicator',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['marketData'], operation: ['economy'] } },
        description: 'Economic indicator name (e.g. gdp, cpi, unemployment). Leave empty to get all indicators.',
      },

      // ------ Crypto input fields ------

      // Crypto symbol (for crypto, cryptoChart)
      {
        displayName: 'Symbol',
        name: 'cryptoSymbol',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            resource: ['crypto'],
            operation: ['crypto', 'cryptoChart'],
          },
        },
        description: 'Cryptocurrency symbol (e.g. bitcoin, ethereum). For Get Crypto, leave empty to get overview.',
      },

      // Days (for cryptoChart)
      {
        displayName: 'Days',
        name: 'days',
        type: 'number',
        default: 30,
        displayOptions: { show: { resource: ['crypto'], operation: ['cryptoChart'] } },
        description: 'Number of days of chart history',
      },

      // DeFi protocol (optional)
      {
        displayName: 'Protocol',
        name: 'protocol',
        type: 'string',
        default: '',
        displayOptions: { show: { resource: ['crypto'], operation: ['defi'] } },
        description: 'DeFi protocol name (e.g. aave, uniswap). Leave empty to get all protocols.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('polarisApi');
    const apiKey = credentials.apiKey as string;

    const headers = { Authorization: `Bearer ${apiKey}` };

    for (let i = 0; i < items.length; i++) {
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;

      let response: any;

      // --- Briefs ---
      if (resource === 'briefs') {
        if (operation === 'getFeed') {
          const limit = this.getNodeParameter('limit', i, 10) as number;
          const category = this.getNodeParameter('category', i, '') as string;
          const qs: Record<string, any> = { per_page: limit, sort: 'date' };
          if (category) qs.category = category;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/feed`,
            headers,
            qs,
          });
        } else if (operation === 'getBrief') {
          const briefId = this.getNodeParameter('briefId', i) as string;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/brief/${briefId}`,
            headers,
          });
        } else if (operation === 'getTimeline') {
          const query = this.getNodeParameter('query', i) as string;
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/timeline`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { topic: query },
          });
        }
      }

      // --- Search ---
      if (resource === 'search') {
        const query = this.getNodeParameter('query', i) as string;
        if (operation === 'search') {
          const limit = this.getNodeParameter('limit', i, 10) as number;
          const category = this.getNodeParameter('category', i, '') as string;
          const qs: Record<string, any> = { q: query, limit };
          if (category) qs.category = category;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/search`,
            headers,
            qs,
          });
        } else if (operation === 'suggest') {
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/search/suggest`,
            headers,
            qs: { q: query },
          });
        } else if (operation === 'webSearch') {
          const limit = this.getNodeParameter('limit', i, 10) as number;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/web-search`,
            headers,
            qs: { q: query, limit },
          });
        }
      }

      // --- Intelligence ---
      if (resource === 'intelligence') {
        if (operation === 'verify') {
          const claim = this.getNodeParameter('claim', i) as string;
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/verify`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { claim },
          });
        } else if (operation === 'forecast') {
          const topic = this.getNodeParameter('topic', i) as string;
          const depth = this.getNodeParameter('depth', i, 'standard') as string;
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/forecast`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { topic, depth },
          });
        } else if (operation === 'context') {
          const topic = this.getNodeParameter('topic', i) as string;
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/intelligence`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { topic },
          });
        }
      }

      // --- Web ---
      if (resource === 'web') {
        const url = this.getNodeParameter('url', i) as string;
        if (operation === 'crawl') {
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/crawl`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { url },
          });
        } else if (operation === 'extract') {
          response = await this.helpers.httpRequest({
            method: 'POST',
            url: `${BASE_URL}/api/v1/extract`,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: { url },
          });
        }
      }

      // --- Market Data ---
      if (resource === 'marketData') {
        if (operation === 'candles') {
          const symbol = this.getNodeParameter('symbol', i) as string;
          const interval = this.getNodeParameter('interval', i, '1d') as string;
          const range = this.getNodeParameter('range', i, '1mo') as string;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/ticker/${encodeURIComponent(symbol)}/candles`,
            headers,
            qs: { interval, range },
          });
        } else if (operation === 'technicals') {
          const symbol = this.getNodeParameter('symbol', i) as string;
          const range = this.getNodeParameter('range', i, '1mo') as string;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/ticker/${encodeURIComponent(symbol)}/technicals`,
            headers,
            qs: { range },
          });
        } else if (operation === 'earnings') {
          const symbol = this.getNodeParameter('symbol', i) as string;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/ticker/${encodeURIComponent(symbol)}/earnings`,
            headers,
          });
        } else if (operation === 'marketMovers') {
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/market/movers`,
            headers,
          });
        } else if (operation === 'marketSummary') {
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/market/summary`,
            headers,
          });
        } else if (operation === 'forex') {
          const pair = this.getNodeParameter('pair', i, '') as string;
          const url = pair
            ? `${BASE_URL}/api/v1/forex/${encodeURIComponent(pair)}`
            : `${BASE_URL}/api/v1/forex`;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url,
            headers,
          });
        } else if (operation === 'commodities') {
          const commoditySymbol = this.getNodeParameter('commoditySymbol', i, '') as string;
          const url = commoditySymbol
            ? `${BASE_URL}/api/v1/commodities/${encodeURIComponent(commoditySymbol)}`
            : `${BASE_URL}/api/v1/commodities`;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url,
            headers,
          });
        } else if (operation === 'economy') {
          const indicator = this.getNodeParameter('indicator', i, '') as string;
          const url = indicator
            ? `${BASE_URL}/api/v1/economy/${encodeURIComponent(indicator)}`
            : `${BASE_URL}/api/v1/economy`;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url,
            headers,
          });
        }
      }

      // --- Crypto ---
      if (resource === 'crypto') {
        if (operation === 'crypto') {
          const cryptoSymbol = this.getNodeParameter('cryptoSymbol', i, '') as string;
          const url = cryptoSymbol
            ? `${BASE_URL}/api/v1/crypto/${encodeURIComponent(cryptoSymbol)}`
            : `${BASE_URL}/api/v1/crypto`;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url,
            headers,
          });
        } else if (operation === 'cryptoTop') {
          const limit = this.getNodeParameter('limit', i, 10) as number;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/crypto/top`,
            headers,
            qs: { limit },
          });
        } else if (operation === 'cryptoChart') {
          const cryptoSymbol = this.getNodeParameter('cryptoSymbol', i) as string;
          const days = this.getNodeParameter('days', i, 30) as number;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url: `${BASE_URL}/api/v1/crypto/${encodeURIComponent(cryptoSymbol)}/chart`,
            headers,
            qs: { days },
          });
        } else if (operation === 'defi') {
          const protocol = this.getNodeParameter('protocol', i, '') as string;
          const url = protocol
            ? `${BASE_URL}/api/v1/crypto/defi/${encodeURIComponent(protocol)}`
            : `${BASE_URL}/api/v1/crypto/defi`;
          response = await this.helpers.httpRequest({
            method: 'GET',
            url,
            headers,
          });
        }
      }

      returnData.push({ json: response ?? {} });
    }

    return [returnData];
  }
}
