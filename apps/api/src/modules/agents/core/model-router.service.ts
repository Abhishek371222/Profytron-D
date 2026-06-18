import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  AiCompletionResult,
  MODEL_TIERS,
  ModelTier,
  isAgentsLowUsage,
  resolveModelTier,
  tierMaxTokens,
} from '../agent.types';

@Injectable()
export class ModelRouterService {
  async complete(
    tier: ModelTier,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<AiCompletionResult> {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('No AI API key configured');
    }

    const config = MODEL_TIERS[tier];
    const isOpenRouter = apiKey.startsWith('sk-or-');
    const baseUrl = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const start = Date.now();
    const response = await axios.post(
      baseUrl,
      {
        model: isOpenRouter ? config.model : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: tierMaxTokens(tier),
        temperature: tier === 'L1' ? 0.2 : 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(isOpenRouter && {
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://profytron.com',
            'X-Title': 'Profytron AI Workforce',
          }),
        },
        timeout: 45_000,
      },
    );

    const usage = response.data?.usage ?? {};
    const inputTokens = usage.prompt_tokens ?? Math.ceil(userPrompt.length / 4);
    const outputTokens =
      usage.completion_tokens ??
      Math.ceil(
        String(response.data?.choices?.[0]?.message?.content ?? '').length / 4,
      );
    const costUsd =
      ((inputTokens + outputTokens) / 1_000_000) * config.costPer1M;

    return {
      text: response.data?.choices?.[0]?.message?.content?.trim() ?? '',
      inputTokens,
      outputTokens,
      modelLevel: tier,
      costUsd,
      latencyMs: Date.now() - start,
    };
  }

  async completeWithEscalation(
    systemPrompt: string,
    userPrompt: string,
    preferTier: ModelTier = 'L1',
  ): Promise<AiCompletionResult> {
    const tier = resolveModelTier(preferTier);
    if (isAgentsLowUsage()) {
      return this.complete('L1', systemPrompt, userPrompt);
    }
    const tiers: ModelTier[] =
      tier === 'L3'
        ? ['L3']
        : tier === 'L2'
          ? ['L2', 'L3']
          : ['L1', 'L2', 'L3'];

    let lastError: unknown;
    for (const tier of tiers) {
      try {
        const result = await this.complete(tier, systemPrompt, userPrompt);
        if (result.text.length > 10) return result;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('All model tiers failed');
  }
}
