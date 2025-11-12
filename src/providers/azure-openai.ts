import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import OpenAI from 'openai';
import createHttpsProxyAgent from 'https-proxy-agent';
import { LLMProvider } from './base.js';
import { KnownError } from '../utils/error.js';
import { generatePrompt } from '../utils/prompt.js';
import type {
    AzureOpenAIConfig,
    GenerateCommitMessageParams,
    GenerateCommitMessageResponse,
} from './types.js';

/**
 * Azure OpenAI provider implementation
 */
export default class AzureOpenAIProvider extends LLMProvider<AzureOpenAIConfig> {
    get name(): string {
        return 'azure-openai';
    }

    protected validateConfig(): void {
        const { apiKey, endpoint } = this.config;
        
        if (!apiKey) {
            throw new KnownError(
                'Please set your Azure OpenAI API key via `aicommit config set AZURE_OPENAI_KEY=<your token>`'
            );
        }

        if (!endpoint) {
            throw new KnownError(
                'Please set your Azure OpenAI endpoint via `aicommit config set AZURE_ENDPOINT=<your endpoint>`'
            );
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
                max_tokens: this.config.maxCompletionTokens,
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
     * Create a chat completion using Azure OpenAI API
     */
    private async createChatCompletion(
        json: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
        // Extract hostname and path from endpoint
        const url = new URL(this.config.endpoint);
        const hostname = url.hostname;
        
        // Azure OpenAI uses deployment name in the path
        const deploymentName = this.config.deploymentName || this.config.model;
        const path = `/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

        const { response, data } = await this.httpsPost(
            hostname,
            path,
            {
                'api-key': this.config.apiKey,
            },
            json,
        );

        if (
            !response.statusCode
            || response.statusCode < 200
            || response.statusCode > 299
        ) {
            let errorMessage = `Azure OpenAI API Error: ${response.statusCode} - ${response.statusMessage}`;

            if (data) {
                errorMessage += `\n\n${data}`;
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
                    'Try increasing the `timeout` config'
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
