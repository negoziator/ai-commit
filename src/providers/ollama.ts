import http from 'http';
import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import type {
    OllamaConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OllamaResponse {
    model: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}

/**
 * Ollama provider implementation for local/self-hosted models
 */
export default class OllamaProvider extends LLMProvider<OllamaConfig> {
    get name(): string {
        return 'ollama';
    }

    protected validateConfig(): void {
        const { endpoint } = this.config;
        
        if (!endpoint) {
            throw new KnownError(
                'Ollama endpoint is not configured. Using default: http://localhost:11434'
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

            const messages: OllamaMessage[] = [
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
            for (let i = 0; i < params.completions; i++) {
                const response = await this.createChatCompletion(messages);
                const messageText = response.message.content;
                
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
                    `Cannot connect to Ollama at ${this.config.endpoint}. ` +
                    'Make sure Ollama is running. Install from: https://ollama.com'
                );
            }
            
            if (errorAsAny.code === 'ENOTFOUND') {
                throw new KnownError(
                    `Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). ` +
                    'Check your OLLAMA_ENDPOINT configuration.'
                );
            }

            throw errorAsAny;
        }
    }

    /**
     * Create a chat completion using Ollama API
     */
    private async createChatCompletion(
        messages: OllamaMessage[],
    ): Promise<OllamaResponse> {
        const requestBody = {
            model: this.config.model,
            messages,
            stream: false,
            options: {
                temperature: this.config.temperature,
                num_predict: this.config.maxCompletionTokens,
            },
        };

        const { response, data } = await this.httpPost(
            this.config.endpoint,
            '/api/chat',
            {},
            requestBody,
        );

        if (
            !response.statusCode
            || response.statusCode < 200
            || response.statusCode > 299
        ) {
            let errorMessage = `Ollama API Error: ${response.statusCode} - ${response.statusMessage}`;

            if (data) {
                try {
                    const errorData = JSON.parse(data);
                    if (errorData.error) {
                        errorMessage += `\n\n${errorData.error}`;
                    }
                } catch {
                    errorMessage += `\n\n${data}`;
                }
            }

            throw new KnownError(errorMessage);
        }

        return JSON.parse(data) as OllamaResponse;
    }

    /**
     * Make an HTTP/HTTPS POST request
     */
    private async httpPost(
        endpoint: string,
        path: string,
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
                    'Try increasing the `timeout` config or check if Ollama is running.'
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
