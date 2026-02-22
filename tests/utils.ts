import path from 'path';
import fs from 'fs/promises';
import { execa, execaNode } from 'execa';
import {
    createFixture as createFixtureBase,
    type FileTree,
    type FsFixture,
} from 'fs-fixture';
import { loadEnvironment } from '../src/utils/dotenv.js';

// Narrowed options type so execa v9 infers stdout as `string`
interface TestExecaOptions {
    cwd?: string;
    env?: Record<string, string | undefined>;
    reject?: boolean;
    extendEnv?: boolean;
    nodeOptions?: string[];
}

// Set NODE_ENV to test so loadEnvironment uses .env.local
process.env.NODE_ENV = 'test';

// Load environment variables (.env.local for local testing)
await loadEnvironment();

const aicommitPath = path.resolve('./dist/cli.mjs');

const createAicommit = (fixture: FsFixture) => {
    const homeEnv = {
        HOME: fixture.path, // Linux
        USERPROFILE: fixture.path, // Windows
    };

    return (
        args?: string[],
        options?: TestExecaOptions,
    ) => execaNode(aicommitPath, args, {
        cwd: fixture.path,
        ...options,
        extendEnv: false,
        env: {
            ...homeEnv,
            ...options?.env,
        },

        // Block tsx nodeOptions
        nodeOptions: [],
    });
};

export const createGit = async (cwd: string) => {
    const git = (
        command: string,
        args?: string[],
        options?: TestExecaOptions,
    ) => (
        execa(
            'git',
            [command, ...(args || [])],
            {
                cwd,
                ...options,
            },
        )
    );

    await git(
        'init',
        [
            // In case of different default branch name
            '--initial-branch=master',
        ],
    );

    await git('config', ['user.name', 'name']);
    await git('config', ['user.email', 'email']);

    return git;
};

export const createFixture = async (
    source?: string | FileTree,
) => {
    const fixture = await createFixtureBase(source);
    const aicommit = createAicommit(fixture);

    return {
        fixture,
        aicommit,
    };
};

export const files = Object.freeze({
    '.aicommit': `OPENAI_KEY=${process.env.OPENAI_KEY}`,
    'data.json': Array.from({ length: 10 }, (_, i) => `${i}. Lorem ipsum dolor sit amet`).join('\n'),
});

export const assertOpenAiToken = () => {
    if (!process.env.OPENAI_KEY) {
        throw new Error('⚠️  process.env.OPENAI_KEY is necessary to run these tests. Skipping...');
    }
};

// See ./diffs/README.md in order to generate diff files
export const getDiff = async (diffName: string): Promise<string> => fs.readFile(
    new URL(`fixtures/${diffName}`, import.meta.url),
    'utf8',
);
