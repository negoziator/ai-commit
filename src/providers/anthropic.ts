import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import createHttpsProxyAgent from 'https-proxy-agent';
import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import type {
    AnthropicConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface AnthropicResponse {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
        type: 'text';
        text: string;
    }>;
    model: string;
    stop_reason: string;
}

/**
 * Anthropic Claude provider implementation
 */
export default class AnthropicProvider extends LLMProvider<AnthropicConfig> {
    get name(): string {
        return 'anthropic';
    }

    protected validateConfig(): void {
        const { apiKey } = this.config;
        
        if (!apiKey) {
            throw new KnownError(
                'Please set your Anthropic API key via `aicommit config set ANTHROPIC_KEY=<your token>`\n' +
                'Get your API key from: https://console.anthropic.com/'
            );
        }

        if (!apiKey.startsWith('sk-ant-')) {
            throw new KnownError('Invalid Anthropic API key: Must start with "sk-ant-"');
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

            const messages: AnthropicMessage[] = [
                {
                    role: 'user',
                    content: params.diff,
                },
            ];

            const allMessages: string[] = [];

            // Generate multiple completions by making multiple requests
            for (let i = 0; i < params.completions; i++) {
                const response = await this.createMessage(systemPrompt, messages);
                const messageText = response.content[0]?.text;
                
                if (messageText) {
                    allMessages.push(this.sanitizeMessage(messageText));
                }
            }

            const messages_deduplicated = this.deduplicateMessages(allMessages);

            return { messages: messages_deduplicated };
        } catch (error) {
            const errorAsAny = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            if (errorAsAny.code === 'ENOTFOUND') {
                throw new KnownError(
                    `Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`
                );
            }

            throw errorAsAny;
        }
    }

    /**
     * Create a message using Anthropic API
     */
    private async createMessage(
        systemPrompt: string,
        messages: AnthropicMessage[],
    ): Promise<AnthropicResponse> {
        const requestBody = {
            model: this.config.model,
            max_tokens: this.config.maxCompletionTokens,
            temperature: this.config.temperature,
            system: systemPrompt,
            messages,
        };

        const { response, data } = await this.httpsPost(
            'api.anthropic.com',
            '/v1/messages',
            {
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01',
            },
            requestBody,
        );

        if (
            !response.statusCode
            || response.statusCode < 200
            || response.statusCode > 299
        ) {
            let errorMessage = `Anthropic API Error: ${response.statusCode} - ${response.statusMessage}`;

            if (data) {
                errorMessage += `\n\n${data}`;
            }

            if (response.statusCode === 500) {
                errorMessage += '\n\nCheck the API status: https://status.anthropic.com';
            }

            throw new KnownError(errorMessage);
        }

        return JSON.parse(data) as AnthropicResponse;
    }

    /**
     * Make an HTTPS POST request
     */
    private async httpsPost(
        hostname: string,
        path: string,
        headers: Record<string, string>,
        json: unknown,
    ): Promise<{
        request: ClientRequest;
        response: IncomingMessage;
        data: string;
    }> {
        return new Promise((resolve, reject) => {
            const postContent = JSON.stringify(json);
            const request = https.request(
                {
                    hostname,
                    path,
                    method: 'POST',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postContent),
                    },
                    timeout: this.config.timeout,
                    agent: (
                        this.config.proxy
                            ? createHttpsProxyAgent(this.config.proxy) as unknown as https.Agent
                            : undefined
                    ),
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
                    'Try increasing the `timeout` config, or checking the Anthropic API status https://status.anthropic.com'
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
