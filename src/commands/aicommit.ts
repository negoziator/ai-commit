import { execa } from 'execa';
import {
    black, dim, green, red, bgCyan,
} from 'kolorist';
import {
    intro, outro, spinner, select, confirm, isCancel,
} from '@clack/prompts';
import {
    assertGitRepo,
    getStagedDiff,
    getDetectedMessage,
} from '../utils/git.js';
import { getConfig } from '../utils/config.js';
import { getProjectConfig } from '../utils/project-config.js';
import { createProvider } from '../providers/index.js';
import type { ProviderConfig } from '../providers/types.js';
import { KnownError, handleCliError } from '../utils/error.js';

export default async (
    generate: number | undefined,
    excludeFiles: string[],
    stageAll: boolean,
    commitType: string | undefined,
    rawArgv: string[],
) => (async () => {
    intro(bgCyan(black(' aicommit ')));
    await assertGitRepo();

    const detectingFiles = spinner();

    if (stageAll) {
        // This should be equivalent behavior to `git commit --all`
        await execa('git', ['add', '--update']);
    }

    detectingFiles.start('Detecting staged files');
    const staged = await getStagedDiff(excludeFiles);

    if (!staged) {
        detectingFiles.stop('Detecting staged files');
        throw new KnownError('No staged changes found. Stage your changes manually, or automatically stage all changes with the `--all` flag.');
    }

    detectingFiles.stop(`${getDetectedMessage(staged.files)}:\n${staged.files.map(file => `     ${file}`).join('\n')
    }`);

    const { env } = process;
    const config = await getConfig({
        OPENAI_KEY: env.OPENAI_KEY || env.OPENAI_API_KEY,
        proxy: env.https_proxy || env.HTTPS_PROXY || env.http_proxy || env.HTTP_PROXY,
        generate: generate?.toString(),
        type: commitType?.toString(),
    });

    const s = spinner();
    s.start('The AI is analyzing your changes');
    let messages: string[];
    try {
        // Build provider-specific config
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
                } as unknown as ProviderConfig; // constrained by union type
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
                // Fallback to openai for safety (validateProviderConfig guards unknown)
                providerConfig = {
                    ...baseConfig,
                    apiKey: config.OPENAI_KEY!,
                } as unknown as ProviderConfig;
        }

        const provider = await createProvider(config.provider, providerConfig);
        const projectConfig = await getProjectConfig();
        const result = await provider.generateCommitMessage({
            diff: staged.diff,
            completions: config.generate,
            projectConfig,
        });
        messages = result.messages;
    } finally {
        s.stop('Changes analyzed');
    }

    if (messages.length === 0) {
        throw new KnownError('No commit messages were generated. Try again.');
    }

    let message: string;
    if (messages.length === 1) {
        [message] = messages;

        let confirmed: boolean | symbol;
        if (config['auto-confirm']) {
            confirmed = true;
            outro(`${green('✔')} Auto confirmed commit message.\n\n   ${message}\n`);
        } else {
            confirmed = await confirm({
                message: `Use this commit message?\n\n   ${message}\n`,
            });
        }

        if (!confirmed || isCancel(confirmed)) {
            outro('Commit cancelled');
            return;
        }
    } else {
        const selected = await select({
            message: `Pick a commit message to use: ${dim('(Ctrl+c to exit)')}`,
            options: messages.map(value => ({ label: value, value })),
        });

        if (isCancel(selected)) {
            outro('Commit cancelled');
            return;
        }

        message = selected as string;
    }

    if (config['prepend-reference']) {
        // Get the current branch name
        const { stdout} = await execa('git', ['branch', '--show-current']);

        // Get reference from branch name
        const taskNumber = stdout.match(/([a-zA-Z])+-([0-9]+)/)?.[0];

        if (taskNumber?.length) {
            // Prepend reference to commit message
            message = `${taskNumber?.toUpperCase()}: ${message}`;
        }
    }

    await execa('git', ['commit', '-m', message, ...rawArgv]);

    outro(`${green('✔')} Successfully committed!`);
})().catch((error) => {
    outro(`${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
});
