/**
 * VeroQ Middleware — Auto-shield LLM responses in any framework.
 *
 * @example OpenAI wrapper
 * ```typescript
 * import { shieldOpenAI } from "@veroq/sdk";
 * import OpenAI from "openai";
 *
 * const client = shieldOpenAI(new OpenAI());
 * const response = await client.chat.completions.create({
 *   model: "gpt-5.4",
 *   messages: [{ role: "user", content: "What's NVIDIA's revenue?" }],
 * });
 * console.log(response.choices[0].message.content);
 * console.log(response.veroqShield.trustScore); // 0.85
 * ```
 *
 * @example Express middleware
 * ```typescript
 * import { shieldMiddleware } from "@veroq/sdk";
 * app.use("/api/ai", shieldMiddleware({ threshold: 0.7 }));
 * ```
 */

import { shield, ShieldResult } from "./shield.js";

// ── OpenAI Wrapper ──

export interface ShieldedResponse<T = any> {
  original: T;
  veroqShield: ShieldResult;
}

export function shieldOpenAI(client: any, options: {
  source?: string;
  agentId?: string;
  maxClaims?: number;
} = {}): any {
  const source = options.source || "openai";

  const originalCreate = client.chat.completions.create.bind(client.chat.completions);

  client.chat.completions.create = async function (...args: any[]) {
    const response = await originalCreate(...args);
    try {
      const text = response.choices?.[0]?.message?.content || "";
      const model = response.model || source;
      if (text.trim().length >= 20) {
        response.veroqShield = await shield(text, {
          source: model,
          agentId: options.agentId,
          maxClaims: options.maxClaims,
        });
      } else {
        response.veroqShield = new ShieldResult({
          text, claims: [], overall_confidence: 1.0, overall_verdict: "no_claims",
        });
      }
    } catch {
      response.veroqShield = new ShieldResult({
        text: "", claims: [], overall_confidence: 0, overall_verdict: "error",
      });
    }
    return response;
  };

  return client;
}

// ── Anthropic Wrapper ──

export function shieldAnthropic(client: any, options: {
  source?: string;
  agentId?: string;
  maxClaims?: number;
} = {}): any {
  const source = options.source || "anthropic";

  const originalCreate = client.messages.create.bind(client.messages);

  client.messages.create = async function (...args: any[]) {
    const response = await originalCreate(...args);
    try {
      const text = response.content?.[0]?.text || "";
      const model = response.model || source;
      if (text.trim().length >= 20) {
        response.veroqShield = await shield(text, {
          source: model,
          agentId: options.agentId,
          maxClaims: options.maxClaims,
        });
      } else {
        response.veroqShield = new ShieldResult({
          text, claims: [], overall_confidence: 1.0, overall_verdict: "no_claims",
        });
      }
    } catch {
      response.veroqShield = new ShieldResult({
        text: "", claims: [], overall_confidence: 0, overall_verdict: "error",
      });
    }
    return response;
  };

  return client;
}

// ── Express Middleware ──

export function shieldMiddleware(options: {
  threshold?: number;
  source?: string;
  agentId?: string;
  maxClaims?: number;
  blockIfUntrusted?: boolean;
} = {}): (req: any, res: any, next: any) => void {
  const threshold = options.threshold ?? 0;

  return (req: any, res: any, next: any) => {
    const originalJson = res.json.bind(res);

    res.json = async function (body: any) {
      // Only shield responses that have text content
      const text = typeof body === "string" ? body
        : body?.text || body?.content || body?.message || body?.summary || body?.answer;

      if (text && typeof text === "string" && text.length >= 20) {
        try {
          const result = await shield(text, {
            source: options.source,
            agentId: options.agentId,
            maxClaims: options.maxClaims,
          });

          body._veroqShield = {
            trustScore: result.trustScore,
            isTrusted: result.isTrusted,
            claimsChecked: result.claimsExtracted,
            corrections: result.corrections,
            receiptIds: result.receiptIds,
          };

          if (options.blockIfUntrusted && !result.isTrusted) {
            return originalJson.call(this, {
              error: "Response blocked by VeroQ Shield — claims contradicted",
              shield: body._veroqShield,
            });
          }

          if (threshold > 0 && result.trustScore < threshold) {
            body._veroqShield.belowThreshold = true;
          }
        } catch {
          // Shield failure is non-blocking
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
}
