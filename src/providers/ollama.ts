import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import type {
    OllamaConfig,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Ollama provider implementation for local/self-hosted models
 * 
 * This provider will be implemented in Phase 4
 * Currently throws an error if instantiated
 */
export default class OllamaProvider extends LLMProvider<OllamaConfig> {
    get name(): string {
        return 'ollama';
    }

    protected validateConfig(): void {
        throw new KnownError(
            'Ollama provider is not yet implemented. Currently only OpenAI is supported.\n' +
            'Track progress: https://github.com/negoziator/ai-commit/issues/320'
        );
    }

    async generateCommitMessage(): Promise<GenerateCommitMessageResponse> {
        throw new KnownError('Ollama provider is not yet implemented');
    }
}
