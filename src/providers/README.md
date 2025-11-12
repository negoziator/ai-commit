# LLM Provider System

This directory contains the abstraction layer for supporting multiple LLM providers in ai-commit.

## Architecture

### Core Components

- **`base.ts`** - Abstract `LLMProvider` class that all providers must extend
- **`types.ts`** - TypeScript types and interfaces for all providers
- **`factory.ts`** - Provider factory for instantiating the correct provider
- **`index.ts`** - Public API exports

### Provider Implementations

- **`openai.ts`** - OpenAI GPT models (Phase 2 - in progress)
- **`anthropic.ts`** - Anthropic Claude models (Phase 4 - planned)
- **`azure-openai.ts`** - Azure OpenAI service (Phase 4 - planned)
- **`ollama.ts`** - Local Ollama models (Phase 4 - planned)
- **`custom.ts`** - Custom RAG endpoints (Phase 4 - planned)

## Usage Example

```typescript
import { createProvider } from './providers/index.js';

// Create a provider instance
const provider = await createProvider('openai', {
  apiKey: 'sk-...',
  model: 'gpt-4o-mini',
  locale: 'en',
  maxLength: 50,
  type: 'conventional',
  timeout: 10000,
  temperature: 0.2,
  maxCompletionTokens: 10000,
});

// Generate commit messages
const result = await provider.generateCommitMessage({
  diff: '... git diff output ...',
  completions: 1,
  projectConfig: { projectPrompt: '...' },
});

console.log(result.messages);
```

## Implementation Status

### ✅ Phase 1: Design (Complete)
- Abstract provider interface
- Type system for all providers
- Provider factory with lazy loading
- Stub implementations for all planned providers

### 🚧 Phase 2: OpenAI Refactor (Next)
- Move existing `src/utils/openai.ts` code into `OpenAIProvider`
- Maintain backward compatibility
- Update `src/commands/aicommit.ts` to use provider system

### 📋 Phase 3: Configuration (Planned)
- Add `provider` config option
- Add provider-specific config keys
- Update config validation

### 📋 Phase 4: Additional Providers (Planned)
- Implement Anthropic provider
- Implement Azure OpenAI provider
- Implement Ollama provider
- Implement Custom provider

### 📋 Phase 5: Documentation (Planned)
- Update README with provider examples
- Document each provider's setup
- Migration guide

### 📋 Phase 6: Testing (Planned)
- Unit tests for each provider
- Integration tests
- Backward compatibility tests

## Adding a New Provider

1. Create a new file `src/providers/my-provider.ts`
2. Extend the `LLMProvider` base class
3. Implement required methods:
   - `get name(): string`
   - `validateConfig(): void`
   - `generateCommitMessage(): Promise<GenerateCommitMessageResponse>`
4. Add provider type to `types.ts`
5. Register in `factory.ts`
6. Add configuration support in `src/utils/config.ts`

## Design Principles

- **Lazy Loading**: Providers are only loaded when needed
- **Type Safety**: Full TypeScript support with strict typing
- **Error Handling**: All errors normalized to `KnownError`
- **Extensibility**: Easy to add new providers
- **Backward Compatibility**: Existing OpenAI usage continues to work
