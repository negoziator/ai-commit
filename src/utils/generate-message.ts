import { execa } from 'execa';
import {
    dim, green, red,
} from 'kolorist';
import {
    outro, spinner, select, confirm, isCancel,
} from '@clack/prompts';
import { ValidConfig } from '../utils/config.js';
import { generateCommitMessage } from '../utils/openai.js';
import { KnownError, handleCliError } from '../utils/error.js';

export default async (
    config: ValidConfig,
    staged: { files: string[], diff: string}
) => (async () => {
    const s = spinner();
    s.start('The AI is analyzing your changes');
    let messages: string[];
    try {
        messages = await generateCommitMessage(
            config.OPENAI_KEY,
            config.model,
            config.locale,
            staged.diff,
            config.generate,
            config['max-length'],
            config.type,
            config.timeout,
            config.temperature,
        );
    } finally {
        s.stop('Changes analyzed');
    }

    if (messages.length === 0) {
        throw new KnownError('No commit messages were generated. Try again.');
    }

    let message: string;
    if (messages.length === 1) {
        [message] = messages;
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

    return message;
})().catch((error) => {
    outro(`${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
});
