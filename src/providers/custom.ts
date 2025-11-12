import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import type {
    CustomProviderConfig,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Custom provider implementation for RAG and custom endpoints
 * 
 * This provider will be implemented in Phase 4
 * Currently throws an error if instantiated
 */
export default class CustomProvider extends LLMProvider<CustomProviderConfig> {
    get name(): string {
        return 'custom';
    }

    protected validateConfig(): void {
        throw new KnownError(
            'Custom provider is not yet implemented. Currently only OpenAI is supported.\n' +
            'Track progress: https://github.com/negoziator/ai-commit/issues/320'
        );
    }

    async generateCommitMessage(): Promise<GenerateCommitMessageResponse> {
        throw new KnownError('Custom provider is not yet implemented');
    }
}
