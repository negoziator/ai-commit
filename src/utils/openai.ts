/**
 * Legacy OpenAI utility - Backward compatibility wrapper
 * 
 * This file maintains backward compatibility with existing code.
 * The actual implementation has been moved to src/providers/openai.ts
 * 
 * @deprecated Use the provider system instead: import { createProvider } from '../providers/index.js'
 */

import { CommitType } from './config.js';
import { getProjectConfig } from './project-config.js';
import OpenAIProvider from '../providers/openai.js';

/**
 * Generate commit messages using OpenAI
 * 
 * @deprecated Use OpenAIProvider directly for new code
 */
export const generateCommitMessage = async (
    apiKey: string,
    model: string,
    locale: string,
    diff: string,
    completions: number,
    maxLength: number,
    type: CommitType,
    timeout: number,
    temperature: number,
    maxCompletionTokens: number,
    proxy?: string,
): Promise<string[]> => {
    // Get project config if available
    const projectConfig = await getProjectConfig();

    // Create provider instance
    const provider = new OpenAIProvider({
        apiKey,
        model,
        locale,
        maxLength,
        type,
        timeout,
        temperature,
        maxCompletionTokens,
        proxy,
    });

    // Generate commit messages
    const result = await provider.generateCommitMessage({
        diff,
        completions,
        projectConfig,
    });

    return result.messages;
};
