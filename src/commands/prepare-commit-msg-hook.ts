import fs from 'fs/promises';
import {
    intro, outro, spinner,
} from '@clack/prompts';
import {
    black, green, red, bgCyan,
} from 'kolorist';
import { getStagedDiff } from '../utils/git.js';
import { getConfig } from '../utils/config.js';
import { getProjectConfig } from '../utils/project-config.js';
import { createProvider } from '../providers/index.js';
import type { ProviderConfig } from '../providers/types.js';
import { KnownError, handleCliError } from '../utils/error.js';

const [messageFilePath, commitSource] = process.argv.slice(2);

export default () => (async () => {
    if (!messageFilePath) {
        throw new KnownError('Commit message file path is missing. This file should be called from the "prepare-commit-msg" git hook');
    }

    // If a commit message is passed in, ignore
    if (commitSource) {
        return;
    }

    // All staged files can be ignored by our filter
    const staged = await getStagedDiff();
    if (!staged) {
        return;
    }

    intro(bgCyan(black(' aicommit ')));

    const { env } = process;
    const config = await getConfig({
        proxy: env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
    });

    const s = spinner();
    s.start('The AI is analyzing your changes');
    let messages: string[];
    try {
        const baseConfig = {
            model: config.model,
            locale: config.locale,
            maxLength: config['max-length'],
            type: config.type,
            timeout: config.timeout,
            temperature: config.temperature,
            maxCompletionTokens: config['max-completion-tokens'],
            proxy: config.proxy,
        } as const;

        let providerConfig: ProviderConfig;
        switch (config.provider) {
            case 'openai':
                providerConfig = {
                    ...baseConfig,
                    apiKey: config.OPENAI_KEY!,
                };
                break;
            case 'anthropic':
                providerConfig = {
                    ...baseConfig,
                    apiKey: config.ANTHROPIC_KEY!,
                } as unknown as ProviderConfig;
                break;
            case 'azure-openai':
                providerConfig = {
                    ...baseConfig,
                    apiKey: config.AZURE_OPENAI_KEY!,
                    endpoint: config.AZURE_ENDPOINT!,
                } as unknown as ProviderConfig;
                break;
            case 'ollama':
                providerConfig = {
                    ...baseConfig,
                    endpoint: config.OLLAMA_ENDPOINT,
                } as unknown as ProviderConfig;
                break;
            case 'custom':
                providerConfig = {
                    ...baseConfig,
                    endpoint: config.CUSTOM_ENDPOINT!,
                    apiKey: config.CUSTOM_KEY,
                } as unknown as ProviderConfig;
                break;
            default:
                providerConfig = {
                    ...baseConfig,
                    apiKey: config.OPENAI_KEY!,
                } as unknown as ProviderConfig;
        }

        const provider = await createProvider(config.provider, providerConfig);
        const projectConfig = await getProjectConfig();
        const result = await provider.generateCommitMessage({
            diff: staged!.diff,
            completions: config.generate,
            projectConfig,
        });
        messages = result.messages;
    } finally {
        s.stop('Changes analyzed');
    }

    /**
     * When `--no-edit` is passed in, the base commit message is empty,
     * and even when you use pass in comments via #, they are ignored.
     *
     * Note: `--no-edit` cannot be detected in argvs so this is the only way to check
     */
    const baseMessage = await fs.readFile(messageFilePath, 'utf8');
    const supportsComments = baseMessage !== '';
    const hasMultipleMessages = messages.length > 1;

    let instructions = '';

    if (supportsComments) {
        instructions = `# 🤖 AI generated commit${hasMultipleMessages ? 's' : ''}\n`;
    }

    if (hasMultipleMessages) {
        if (supportsComments) {
            instructions += '# Select one of the following messages by uncommeting:\n';
        }
        instructions += `\n${messages.map(message => `# ${message}`).join('\n')}`;
    } else {
        if (supportsComments) {
            instructions += '# Edit the message below and commit:\n';
        }
        instructions += `\n${messages[0]}\n`;
    }

    await fs.appendFile(
        messageFilePath,
        instructions,
    );
    outro(`${green('✔')} Saved commit message!`);
})().catch((error) => {
    outro(`${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
});
