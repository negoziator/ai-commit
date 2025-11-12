import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import type {
    OpenAIConfig,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * OpenAI provider implementation
 * 
 * This will be properly implemented in Phase 2 by refactoring
 * the existing code from src/utils/openai.ts
 */
export default class OpenAIProvider extends LLMProvider<OpenAIConfig> {
    get name(): string {
        return 'openai';
    }

    protected validateConfig(): void {
        const { apiKey } = this.config;
        
        if (!apiKey) {
            throw new KnownError(
                'Please set your OpenAI API key via `aicommit config set OPENAI_KEY=<your token>`'
            );
        }

        if (!apiKey.startsWith('sk-')) {
            throw new KnownError('Invalid OpenAI API key: Must start with "sk-"');
        }
    }

    async generateCommitMessage(): Promise<GenerateCommitMessageResponse> {
        // This will be implemented in Phase 2 by moving code from src/utils/openai.ts
        throw new KnownError(
            'OpenAI provider implementation pending - Phase 2.\n' +
            'The existing openai.ts utility will be refactored into this provider.'
        );
    }
}
