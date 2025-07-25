import https from 'https';
import { ClientRequest, IncomingMessage } from 'http';
import OpenAI from 'openai';
import createHttpsProxyAgent from 'https-proxy-agent';
import { KnownError } from './error.js';
import { CommitType } from './config.js';
import { generatePrompt } from './prompt.js';
import { getProjectConfig } from './project-config.js';

const httpsPost = async (
    hostname: string,
    path: string,
    headers: Record<string, string>,
    json: unknown,
    timeout: number,
    proxy?: string,
) => new Promise<{
    request: ClientRequest;
    response: IncomingMessage;
    data: string;
}>((resolve, reject) => {
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
            timeout,
            agent: (
                proxy
                    ? createHttpsProxyAgent(proxy) as unknown as https.Agent
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
        reject(new KnownError(`Time out error: request took over ${timeout}ms. Try increasing the \`timeout\` config, or checking the OpenAI API status https://status.openai.com`));
    });

    request.write(postContent);
    request.end();
});

const createChatCompletion = async (
    apiKey: string,
    json: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
    timeout: number,
    proxy?: string,
) => {
    const { response, data } = await httpsPost(
        'api.openai.com',
        '/v1/chat/completions',
        {
            Authorization: `Bearer ${apiKey}`,
        },
        json,
        timeout,
        proxy,
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
};

const sanitizeMessage = (message: string) => message.trim().replace(/[\n\r]/g, '').replace(/(\w)\.$/, '$1');

const deduplicateMessages = (array: string[]) => Array.from(new Set(array));

// const generateStringFromLength = (length: number) => {
// 	let result = '';
// 	const highestTokenChar = 'z';
// 	for (let i = 0; i < length; i += 1) {
// 		result += highestTokenChar;
// 	}
// 	return result;
// };

// const getTokens = (prompt: string, model: TiktokenModel) => {
// 	const encoder = encoding_for_model(model);
// 	const tokens = encoder.encode(prompt).length;
// 	// Free the encoder to avoid possible memory leaks.
// 	encoder.free();
// 	return tokens;
// };

export const generateCommitMessage = async (
    apiKey: string,
    model: string,
    locale: string,
    diff: string,
    completions: number,
    maxLength: number,
    type: CommitType,
    timeout: number,
    temperature: number,
    maxCompletionTokens: number,
) => {
    try {
        // Get project config if available
        const projectConfig = await getProjectConfig();

        const completion = await createChatCompletion(
            apiKey,
            {
                model,
                messages: [
                    {
                        role: 'system',
                        content: generatePrompt(locale, maxLength, type, projectConfig),
                    },
                    {
                        role: 'user',
                        content: diff,
                    },
                ],
                temperature: temperature,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                max_completion_tokens: maxCompletionTokens,
                stream: false,
                n: completions,
            },
            timeout,
        );

        return deduplicateMessages(
            completion.choices
                .filter(choice => choice.message?.content)
                .map(choice => sanitizeMessage(choice.message!.content as string)),
        );
    } catch (error) {
        const errorAsAny = error as any; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (errorAsAny.code === 'ENOTFOUND') {
            throw new KnownError(`Error connecting to ${errorAsAny.hostname} (${errorAsAny.syscall}). Are you connected to the internet?`);
        }

        throw errorAsAny;
    }
};
