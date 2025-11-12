import http from 'http';
import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import type {
    CustomProviderConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Custom provider implementation for RAG and custom endpoints
 * 
 * This provider expects an OpenAI-compatible API endpoint.
 * If your endpoint uses a different format, you may need to fork and customize this provider.
 */
export default class CustomProvider extends LLMProvider<CustomProviderConfig> {
    get name(): string {
        return 'custom';
    }

    protected validateConfig(): void {
        const { endpoint } = this.config;
        
        if (!endpoint) {
            throw new KnownError(
                'Please set your custom endpoint via `aicommit config set CUSTOM_ENDPOINT=<your endpoint>`'
            );
        }
    }

    async generateCommitMessage(
        params: GenerateCommitMessageParams
    ): Promise<GenerateCommitMessageResponse> {
        try {
            const systemPrompt = generatePrompt(
                this.config.locale,
                this.config.maxLength,
                this.config.type,
                params.projectConfig
            );

            const messages = [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: params.diff,
                },
            ];

            const allMessages: string[] = [];

            // Generate multiple completions by making multiple requests
            // Note: Some custom endpoints may support n parameter like OpenAI
            for (let i = 0; i < params.completions; i++) {
                const response = await this.createChatCompletion(messages);
                
                // Try to extract message from OpenAI-compatible response
                let messageText: string | undefined;
                
                if (response.choices && response.choices[0]?.message?.content) {
                    messageText = response.choices[0].message.content;
                } else if (response.message?.content) {
                    messageText = response.message.content;
                } else if (response.content) {
                    messageText = response.content;
                } else if (typeof response === 'string') {
                    messageText = response;
                }
                
                if (messageText) {
                    allMessages.push(this.sanitizeMessage(messageText));
                }
            }

            const messages_deduplicated = this.deduplicateMessages(allMessages);

            return { messages: messages_deduplicated };
        } catch (error) {
            const errorAsAny = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            
            if (errorAsAny.code === 'ECONNREFUSED') {
                throw new KnownError(
                    `Cannot connect to custom endpoint at ${this.config.endpoint}. ` +
                    'Make sure your endpoint is running and accessible.'
                );
            }
            
            if (errorAsAny.code === 'ENOTFOUND') {
                throw new KnownError(
                    `Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). ` +
                    'Check your CUSTOM_ENDPOINT configuration.'
                );
            }

            throw errorAsAny;
        }
    }

    /**
     * Create a chat completion using custom endpoint
     * Assumes OpenAI-compatible API format
     */
    private async createChatCompletion(
        messages: Array<{ role: string; content: string }>,
    ): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        const requestBody = {
            model: this.config.model,
            messages,
            temperature: this.config.temperature,
            max_tokens: this.config.maxCompletionTokens,
        };

        const headers: Record<string, string> = {
            ...(this.config.headers || {}),
        };

        // Add authorization if API key is provided
        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        const { response, data } = await this.httpPost(
            this.config.endpoint,
            '', // Path is included in endpoint
            headers,
            requestBody,
        );

        if (
            !response.statusCode
            || response.statusCode < 200
            || response.statusCode > 299
        ) {
            let errorMessage = `Custom API Error: ${response.statusCode} - ${response.statusMessage}`;

            if (data) {
                errorMessage += `\n\n${data}`;
            }

            throw new KnownError(errorMessage);
        }

        return JSON.parse(data);
    }

    /**
     * Make an HTTP/HTTPS POST request
     */
    private async httpPost(
        endpoint: string,
        additionalPath: string,
        headers: Record<string, string>,
        json: unknown,
    ): Promise<{
        request: ClientRequest;
        response: IncomingMessage;
        data: string;
    }> {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;
            
            const path = url.pathname + (additionalPath || '');
            
            const postContent = JSON.stringify(json);
            const request = httpModule.request(
                {
                    hostname: url.hostname,
                    port: url.port || (isHttps ? 443 : 80),
                    path,
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postContent),
                    },
                    timeout: this.config.timeout,
                },
                (response) => {
                    const body: Buffer[] = [];
                    response.on('data', chunk => body.push(chunk));
                    response.on('end', () => {
                        resolve({
                            request,
                            response,
                            data: Buffer.concat(body).toString(),
                        });
                    });
                },
            );
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new KnownError(
                    `Time out error: request took over ${this.config.timeout}ms. ` +
                    'Try increasing the `timeout` config.'
                ));
            });

            request.write(postContent);
            request.end();
        });
    }

    /**
     * Sanitize a commit message
     */
    private sanitizeMessage(message: string): string {
        return message.trim().replace(/[\n\r]/g, '').replace(/(\w)\.$/, '$1');
    }

    /**
     * Remove duplicate messages
     */
    private deduplicateMessages(array: string[]): string[] {
        return Array.from(new Set(array));
    }
}
