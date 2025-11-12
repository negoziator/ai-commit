import { KnownError } from '../utils/error.js';
import type { LLMProvider } from './base.js';
import type { ProviderType, ProviderConfig } from './types.js';

/**
 * Registry of available providers
 * Providers are lazy-loaded to avoid importing unnecessary dependencies
 */
const providerRegistry: Record<
    ProviderType,
    () => Promise<{ default: new (config: any) => LLMProvider }> // eslint-disable-line @typescript-eslint/no-explicit-any
> = {
    openai: () => import('./openai.js'),
    anthropic: () => import('./anthropic.js'),
    'azure-openai': () => import('./azure-openai.js'),
    ollama: () => import('./ollama.js'),
    custom: () => import('./custom.js'),
};

/**
 * Create an LLM provider instance based on the provider type
 * @param providerType - Type of provider to create
 * @param config - Provider-specific configuration
 * @returns Instantiated provider
 */
export async function createProvider(
    providerType: ProviderType,
    config: ProviderConfig,
): Promise<LLMProvider> {
    const providerLoader = providerRegistry[providerType];

    if (!providerLoader) {
        throw new KnownError(
            `Unknown provider type: ${providerType}. Supported providers: ${Object.keys(providerRegistry).join(', ')}`,
        );
    }

    try {
        const providerModule = await providerLoader();
        const ProviderClass = providerModule.default;
        return new ProviderClass(config);
    } catch (error) {
        if (error instanceof KnownError) {
            throw error;
        }

        // Handle missing provider implementation
        if ((error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
            throw new KnownError(
                `Provider "${providerType}" is not yet implemented. Currently supported: openai`,
            );
        }

        throw new KnownError(
            `Failed to initialize provider "${providerType}": ${(error as Error).message}`,
        );
    }
}

/**
 * Check if a provider type is supported
 * @param providerType - Provider type to check
 */
export function isProviderSupported(providerType: string): providerType is ProviderType {
    return providerType in providerRegistry;
}
