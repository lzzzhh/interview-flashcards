// backend/src/services/llm-provider.ts — LLM Provider 抽象

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
}

export interface LLMResponse {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMProvider {
  name: string;
  chat(request: LLMRequest): Promise<LLMResponse>;
}

export class OpenAIChatProvider implements LLMProvider {
  name = 'openai';
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 2048,
        response_format: request.responseFormat ? { type: request.responseFormat } : undefined,
      }),
    });
    if (!res.ok) throw new Error(`LLM error: ${res.status}`);
    const data = await res.json() as any;
    return {
      text: data.choices?.[0]?.message?.content || '',
      usage: data.usage ? { promptTokens: data.usage.prompt_tokens, completionTokens: data.usage.completion_tokens, totalTokens: data.usage.total_tokens } : undefined,
    };
  }
}

// 全局 provider 实例（启动时根据配置初始化）
let provider: LLMProvider | null = null;

export function setLLMProvider(p: LLMProvider) { provider = p; }
export function getLLMProvider(): LLMProvider | null { return provider; }
