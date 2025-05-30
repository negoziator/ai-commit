import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ini from 'ini';
import { fileExists } from './fs.js';
import { KnownError } from './error.js';
import { getProjectConfig } from './project-config.js';

const commitTypes = ['', 'conventional'] as const;

export type CommitType = typeof commitTypes[number];

const { hasOwnProperty } = Object.prototype;
export const hasOwn = (object: unknown, key: PropertyKey) => hasOwnProperty.call(object, key);

const parseAssert = (
    name: string,
    condition: any, // eslint-disable-line @typescript-eslint/no-explicit-any
    message: string,
) => {
    if (!condition) {
        throw new KnownError(`Invalid config property ${name}: ${message}`);
    }
};

const configParsers = {
    OPENAI_KEY(key?: string) {
        if (!key) {
            throw new KnownError('Please set your OpenAI API key via `aicommit config set OPENAI_KEY=<your token>`');
        }
        parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');
        // Key can range from 43~51 characters. There's no spec to assert this.

        return key;
    },
    locale(locale?: string) {
        if (!locale) {
            return 'en';
        }

        parseAssert('locale', locale, 'Cannot be empty');
        parseAssert('locale', /^[a-z-]+$/i.test(locale), 'Must be a valid locale (letters and dashes/underscores). You can consult the list of codes in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes');
        return locale;
    },
    generate(count?: string) {
        if (!count) {
            return 1;
        }

        parseAssert('generate', /^\d+$/.test(count), 'Must be an integer');

        const parsed = Number(count);
        parseAssert('generate', parsed > 0, 'Must be greater than 0');
        parseAssert('generate', parsed <= 5, 'Must be less or equal to 5');

        return parsed;
    },
    type(type?: string) {
        if (!type) {
            return '';
        }

        parseAssert('type', commitTypes.includes(type as CommitType), 'Invalid commit type');

        return type as CommitType;
    },
    proxy(url?: string) {
        if (!url || url.length === 0) {
            return undefined;
        }

        parseAssert('proxy', /^https?:\/\//.test(url), 'Must be a valid URL');

        return url;
    },
    model(model?: string) {
        if (!model || model.length === 0) {
            return 'gpt-4o-mini';
        }

        return model;
    },
    timeout(timeout?: string) {
        if (!timeout) {
            return 10_000;
        }

        parseAssert('timeout', /^\d+$/.test(timeout), 'Must be an integer');

        const parsed = Number(timeout);
        parseAssert('timeout', parsed >= 500, 'Must be greater than 500ms');

        return parsed;
    },
    temperature(temperature?: string) {
        if (!temperature) {
            return 0.2;
        }

        parseAssert('temperature', /^(2|\d)(\.\d{1,2})?$/.test(temperature), 'Must be decimal between 0 and 2');

        const parsed = Number(temperature);
        parseAssert('temperature', parsed > 0.0, 'Must be greater than 0');
        parseAssert('temperature', parsed <= 2.0, 'Must be less than or equal to 2');

        return parsed;
    },
    'max-length'(maxLength?: string) {
        if (!maxLength) {
            return 50;
        }

        parseAssert('max-length', /^\d+$/.test(maxLength), 'Must be an integer');

        const parsed = Number(maxLength);
        parseAssert('max-length', parsed >= 20, 'Must be greater than 20 characters');

        return parsed;
    },
    'max-completion-tokens'(maxCompletionTokens?: string) {
        if (!maxCompletionTokens) {
            return 10000;
        }

        parseAssert('max-completion-tokens', /^\d+$/.test(maxCompletionTokens), 'Must be an integer');

        const parsed = Number(maxCompletionTokens);
        parseAssert('max-completion-tokens', parsed > 0, 'Must be greater than 0');

        return parsed;
    },
    'auto-confirm'(autoConfirm?: string | boolean) {
        if (!autoConfirm) {
            return false;
        }

        if (typeof autoConfirm === 'boolean') {
            return autoConfirm;
        }

        parseAssert('auto-confirm', /^(?:true|false)$/.test(autoConfirm), 'Must be a boolean');
        return autoConfirm === 'true';
    },
    'prepend-reference'(prependReference?: string | boolean) {
        if (!prependReference) {
            return false;
        }

        if (typeof prependReference === 'boolean') {
            return prependReference;
        }

        parseAssert('prepend-reference', /^(?:true|false)$/.test(prependReference), 'Must be a boolean');
        return prependReference === 'true';
    },
} as const;

type ConfigKeys = keyof typeof configParsers;

type RawConfig = {
    [key in ConfigKeys]?: string;
};

export type ValidConfig = {
    [Key in ConfigKeys]: ReturnType<typeof configParsers[Key]>;
};

const configPath = path.join(os.homedir(), '.aicommit');

const readConfigFile = async (): Promise<RawConfig> => {
    const configExists = await fileExists(configPath);
    if (!configExists) {
        return Object.create(null);
    }

    const configString = await fs.readFile(configPath, 'utf8');
    return ini.parse(configString);
};

export const getConfig = async (
    cliConfig?: RawConfig,
    suppressErrors?: boolean,
): Promise<ValidConfig> => {
    const config = await readConfigFile();
    const projectConfig = await getProjectConfig();
    const parsedConfig: Record<string, unknown> = {};

    for (const key of Object.keys(configParsers) as ConfigKeys[]) {
        const parser = configParsers[key];
        // Project config takes precedence over global config and CLI config
        let value = projectConfig?.[key] ?? cliConfig?.[key] ?? config[key];

        // Ensure the value is coerced to a string if it's a boolean
        if (typeof value === 'boolean') {
            value = value.toString();
        }

        if (suppressErrors) {
            try {
                parsedConfig[key] = parser(value);
            } catch {} // eslint-disable-line no-empty
        } else {
            parsedConfig[key] = parser(value);
        }
    }

    return parsedConfig as ValidConfig;
};

export const setConfigs = async (
    keyValues: [key: string, value: string][],
) => {
    const config = await readConfigFile();

    for (const [key, value] of keyValues) {
        if (!hasOwn(configParsers, key)) {
            throw new KnownError(`Invalid config property: ${key}`);
        }

        const parsed = configParsers[key as ConfigKeys](value);
        config[key as ConfigKeys] = parsed as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    await fs.writeFile(configPath, ini.stringify(config), 'utf8');
};
