import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import type {
    AnthropicConfig,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Anthropic Claude provider implementation
 * 
 * This provider will be implemented in Phase 4
 * Currently throws an error if instantiated
 */
export default class AnthropicProvider extends LLMProvider<AnthropicConfig> {
    get name(): string {
        return 'anthropic';
    }

    protected validateConfig(): void {
        throw new KnownError(
            'Anthropic provider is not yet implemented. Currently only OpenAI is supported.\n' +
            'Track progress: https://github.com/negoziator/ai-commit/issues/320'
        );
    }

    async generateCommitMessage(): Promise<GenerateCommitMessageResponse> {
        throw new KnownError('Anthropic provider is not yet implemented');
    }
}
