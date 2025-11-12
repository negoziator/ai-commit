import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import type {
    AzureOpenAIConfig,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Azure OpenAI provider implementation
 * 
 * This provider will be implemented in Phase 4
 * Currently throws an error if instantiated
 */
export default class AzureOpenAIProvider extends LLMProvider<AzureOpenAIConfig> {
    get name(): string {
        return 'azure-openai';
    }

    protected validateConfig(): void {
        throw new KnownError(
            'Azure OpenAI provider is not yet implemented. Currently only OpenAI is supported.\n' +
            'Track progress: https://github.com/negoziator/ai-commit/issues/320'
        );
    }

    async generateCommitMessage(): Promise<GenerateCommitMessageResponse> {
        throw new KnownError('Azure OpenAI provider is not yet implemented');
    }
}
