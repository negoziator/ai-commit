import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import type {
    OpenAIConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * OpenAI provider implementation
 */
export default class OpenAIProvider extends LLMProvider<OpenAIConfig> {
    get name(): string {
        return 'openai';
    }

    protected validateConfig(): void {
        const { apiKey } = this.config;
        
        if (!apiKey) {
            throw new KnownError(
                'Please set your OpenAI API key via `aicommit config set OPENAI_KEY=<your token>`'
            );
        }

        if (!apiKey.startsWith('sk-')) {
            throw new KnownError('Invalid OpenAI API key: Must start with "sk-"');
        }
    }

    async generateCommitMessage(
        params: GenerateCommitMessageParams
    ): Promise<GenerateCommitMessageResponse> {
        try {
            const completion = await this.createChatCompletion({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: generatePrompt(
                            this.config.locale,
                            this.config.maxLength,
                            this.config.type,
                            params.projectConfig
                        ),
                    },
                    {
                        role: 'user',
                        content: params.diff,
                    },
                ],
                temperature: this.config.temperature,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                max_completion_tokens: this.config.maxCompletionTokens,
                stream: false,
                n: params.completions,
            });

            const messages = this.deduplicateMessages(
                completion.choices
                    .filter(choice => choice.message?.content)
                    .map(choice => this.sanitizeMessage(choice.message!.content as string)),
            );

            return { messages };
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
     * Create a chat completion using OpenAI API
     */
    private async createChatCompletion(
        json: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
        const { response, data } = await this.httpsPost(
            'api.openai.com',
            '/v1/chat/completions',
            {
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            json,
        );

        if (
            !response.statusCode
            || response.statusCode < 200
            || response.statusCode > 299
        ) {
            let errorMessage = `OpenAI API Error: ${response.statusCode} - ${response.statusMessage}`;

            if (data) {
                errorMessage += `\n\n${data}`;
            }

            if (response.statusCode === 500) {
                errorMessage += '\n\nCheck the API status: https://status.openai.com';
            }

            throw new KnownError(errorMessage);
        }

        return JSON.parse(data) as OpenAI.Chat.Completions.ChatCompletion;
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
                            ? new HttpsProxyAgent(this.config.proxy) as unknown as https.Agent
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
                    'Try increasing the `timeout` config, or checking the OpenAI API status https://status.openai.com'
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
