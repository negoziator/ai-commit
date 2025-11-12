import type { CommitType } from '../utils/config.js';
import type { ProjectConfig } from '../utils/project-config.js';

/**
 * Supported LLM provider types
 */
export const PROVIDER_TYPES = ['openai', 'anthropic', 'azure-openai', 'ollama', 'custom'] as const;
export type ProviderType = typeof PROVIDER_TYPES[number];

/**
 * Base configuration required by all providers
 */
export interface BaseProviderConfig {
    model: string;
    locale: string;
    maxLength: number;
    type: CommitType;
    timeout: number;
    temperature: number;
    maxCompletionTokens: number;
    proxy?: string;
}

/**
 * OpenAI-specific configuration
 */
export interface OpenAIConfig extends BaseProviderConfig {
    apiKey: string;
}

/**
 * Anthropic-specific configuration
 */
export interface AnthropicConfig extends BaseProviderConfig {
    apiKey: string;
}

/**
 * Azure OpenAI-specific configuration
 */
export interface AzureOpenAIConfig extends BaseProviderConfig {
    apiKey: string;
    endpoint: string;
    deploymentName?: string;
}

/**
 * Ollama-specific configuration
 */
export interface OllamaConfig extends BaseProviderConfig {
    endpoint: string;
}

/**
 * Custom provider configuration (for RAG or other custom endpoints)
 */
export interface CustomProviderConfig extends BaseProviderConfig {
    endpoint: string;
    apiKey?: string;
    headers?: Record<string, string>;
}

/**
 * Union type of all provider configurations
 */
export type ProviderConfig =
    | OpenAIConfig
    | AnthropicConfig
    | AzureOpenAIConfig
    | OllamaConfig
    | CustomProviderConfig;

/**
 * Parameters for generating commit messages
 */
export interface GenerateCommitMessageParams {
    diff: string;
    completions: number;
    projectConfig?: ProjectConfig;
}

/**
 * Response from LLM provider
 */
export interface GenerateCommitMessageResponse {
    messages: string[];
}
