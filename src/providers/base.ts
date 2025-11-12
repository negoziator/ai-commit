import type {
    ProviderConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Abstract base class for LLM providers
 * All provider implementations must extend this class
 */
export abstract class LLMProvider<TConfig extends ProviderConfig = ProviderConfig> {
    protected config: TConfig;

    constructor(config: TConfig) {
        this.config = config;
        this.validateConfig();
    }

    /**
     * Unique identifier for this provider
     */
    abstract get name(): string;

    /**
     * Validate provider-specific configuration
     * Throws KnownError if configuration is invalid
     */
    protected abstract validateConfig(): void;

    /**
     * Generate commit messages based on git diff
     * @param params - Parameters including diff and project context
     * @returns Array of generated commit messages
     */
    abstract generateCommitMessage(
        params: GenerateCommitMessageParams
    ): Promise<GenerateCommitMessageResponse>;

    /**
     * Get the configuration for this provider
     */
    getConfig(): TConfig {
        return this.config;
    }

    /**
     * Update provider configuration
     * @param updates - Partial configuration updates
     */
    updateConfig(updates: Partial<TConfig>): void {
        this.config = { ...this.config, ...updates };
        this.validateConfig();
    }
}
