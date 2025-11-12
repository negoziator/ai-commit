/**
 * LLM Provider System
 * 
 * This module provides an abstraction layer for different LLM providers,
 * allowing ai-commit to work with OpenAI, Anthropic, Azure OpenAI, Ollama,
 * and custom RAG implementations.
 * 
 * @example
 * ```typescript
 * import { createProvider } from './providers/index.js';
 * 
 * const provider = await createProvider('openai', {
 *   apiKey: 'sk-...',
 *   model: 'gpt-4o-mini',
 *   locale: 'en',
 *   maxLength: 50,
 *   type: 'conventional',
 *   timeout: 10000,
 *   temperature: 0.2,
 *   maxCompletionTokens: 10000,
 * });
 * 
 * const result = await provider.generateCommitMessage({
 *   diff: '...',
 *   completions: 1,
 * });
 * ```
 */

export { LLMProvider } from './base.js';
export { createProvider, isProviderSupported } from './factory.js';
export type {
    ProviderType,
    ProviderConfig,
    BaseProviderConfig,
    OpenAIConfig,
    AnthropicConfig,
    AzureOpenAIConfig,
    OllamaConfig,
    CustomProviderConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
    PROVIDER_TYPES,
} from './types.js';
