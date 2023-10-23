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
import { generateCommitMessage } from '../utils/openai.js';
import { KnownError, handleCliError } from '../utils/error.js';
import generateMessage from "../utils/generate-message.js";

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

    let message = await generateMessage(config, staged);

    if (!message) {
        return;
    }

    let confirmed: boolean = false;
    if (config['auto-confirm']) {
        confirmed = true;
        outro(`${green('✔')} Auto confirmed commit message.\n\n   ${message}\n`);
    } else {

        while (!confirmed) {

            if (message === undefined) {
                message = await generateMessage(config, staged);
            }

            let choice: string;
            const selected = await select({
                message: `Use this commit message?\n\n   ${message}\n`,
                options:  [ { label: "Yes", value: "Yes" }, { label: "No", value: "No" }, { label: "Retry", value: "Retry" } ]
            });

            choice = selected as string;

            if (choice === "Yes") {
                confirmed = true;
            }

            if (choice === "No") {
                break;
            }

            message = undefined;
        }

    }

    if (!message) {
        outro('No message generated. Commit cancelled');
        return;
    }

    if (!confirmed || isCancel(confirmed)) {
        outro('Commit cancelled');
        return;
    }

    await execa('git', ['commit', '-m', message, ...rawArgv]);

    outro(`${green('✔')} Successfully committed!`);
})().catch((error) => {
    outro(`${red('✖')} ${error.message}`);
    handleCliError(error);
    process.exit(1);
});
