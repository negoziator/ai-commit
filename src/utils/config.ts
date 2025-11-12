import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import ini from 'ini';
import { fileExists } from './fs.js';
import { KnownError } from './error.js';
import { getProjectConfig } from './project-config.js';
import { loadEnvironment } from './dotenv.js';
import { PROVIDER_TYPES, type ProviderType } from '../providers/types.js';

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
    provider(providerType?: string) {
        if (!providerType) {
            return 'openai' as ProviderType;
        }

        parseAssert(
            'provider',
            PROVIDER_TYPES.includes(providerType as ProviderType),
            `Must be one of: ${PROVIDER_TYPES.join(', ')}`
        );

        return providerType as ProviderType;
    },
    OPENAI_KEY(key?: string) {
        // Optional - only required if provider is openai (default)
        // Validation happens in validateProviderConfig()
        if (!key) {
            return undefined;
        }
        parseAssert('OPENAI_KEY', key.startsWith('sk-'), 'Must start with "sk-"');
        // Key can range from 43~51 characters. There's no spec to assert this.

        return key;
    },
    ANTHROPIC_KEY(key?: string) {
        // Optional - only required if provider is anthropic
        if (!key) {
            return undefined;
        }
        parseAssert('ANTHROPIC_KEY', key.startsWith('sk-ant-'), 'Must start with "sk-ant-"');
        return key;
    },
    AZURE_OPENAI_KEY(key?: string) {
        // Optional - only required if provider is azure-openai
        return key;
    },
    AZURE_ENDPOINT(endpoint?: string) {
        // Optional - only required if provider is azure-openai
        if (!endpoint) {
            return undefined;
        }
        parseAssert('AZURE_ENDPOINT', /^https?:\/\//.test(endpoint), 'Must be a valid URL');
        return endpoint;
    },
    OLLAMA_ENDPOINT(endpoint?: string) {
        // Optional - only required if provider is ollama
        if (!endpoint) {
            return 'http://localhost:11434'; // Default Ollama endpoint
        }
        parseAssert('OLLAMA_ENDPOINT', /^https?:\/\//.test(endpoint), 'Must be a valid URL');
        return endpoint;
    },
    CUSTOM_ENDPOINT(endpoint?: string) {
        // Optional - only required if provider is custom
        if (!endpoint) {
            return undefined;
        }
        parseAssert('CUSTOM_ENDPOINT', /^https?:\/\//.test(endpoint), 'Must be a valid URL');
        return endpoint;
    },
    CUSTOM_KEY(key?: string) {
        // Optional - only required if provider is custom and endpoint requires auth
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

/**
 * Validate provider-specific configuration requirements
 */
const validateProviderConfig = (config: ValidConfig): void => {
    const provider = config.provider;

    switch (provider) {
        case 'openai':
            if (!config.OPENAI_KEY) {
                throw new KnownError(
                    'Please set your OpenAI API key via `aicommit config set OPENAI_KEY=<your token>`'
                );
            }
            break;

        case 'anthropic':
            if (!config.ANTHROPIC_KEY) {
                throw new KnownError(
                    'Please set your Anthropic API key via `aicommit config set ANTHROPIC_KEY=<your token>`\n' +
                    'Get your API key from: https://console.anthropic.com/'
                );
            }
            break;

        case 'azure-openai':
            if (!config.AZURE_OPENAI_KEY) {
                throw new KnownError(
                    'Please set your Azure OpenAI API key via `aicommit config set AZURE_OPENAI_KEY=<your token>`'
                );
            }
            if (!config.AZURE_ENDPOINT) {
                throw new KnownError(
                    'Please set your Azure OpenAI endpoint via `aicommit config set AZURE_ENDPOINT=<your endpoint>`'
                );
            }
            break;

        case 'ollama':
            // OLLAMA_ENDPOINT has a default, so no validation needed
            break;

        case 'custom':
            if (!config.CUSTOM_ENDPOINT) {
                throw new KnownError(
                    'Please set your custom endpoint via `aicommit config set CUSTOM_ENDPOINT=<your endpoint>`'
                );
            }
            break;

        default:
            throw new KnownError(`Unknown provider: ${provider}`);
    }
};

export const getConfig = async (
    cliConfig?: RawConfig,
    suppressErrors?: boolean,
): Promise<ValidConfig> => {
    // Load environment variables (.env for CLI, .env.local for tests)
    await loadEnvironment();

    const config = await readConfigFile();
    const projectConfig = await getProjectConfig();
    const parsedConfig: Record<string, unknown> = {};

    for (const key of Object.keys(configParsers) as ConfigKeys[]) {
        const parser = configParsers[key];
        // Priority: Project config > CLI config > Environment variables > Global config
        let value = projectConfig?.[key] ?? cliConfig?.[key] ?? process.env[key] ?? config[key];

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

    const validConfig = parsedConfig as ValidConfig;

    // Validate provider-specific requirements
    if (!suppressErrors) {
        validateProviderConfig(validConfig);
    }

    return validConfig;
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
