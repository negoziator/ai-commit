import fs from 'fs/promises';
import path from 'path';
import { fileExists } from './fs.js';

/**
 * Parse .env file content into key-value pairs
 */
function parseEnvContent(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
        // Skip empty lines and comments
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        // Parse KEY=VALUE format
        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
        if (!match) {
            continue;
        }

        const [, key, value] = match;
        
        // Remove quotes if present
        let parsedValue = value.trim();
        if (
            (parsedValue.startsWith('"') && parsedValue.endsWith('"')) ||
            (parsedValue.startsWith("'") && parsedValue.endsWith("'"))
        ) {
            parsedValue = parsedValue.slice(1, -1);
        }

        env[key] = parsedValue;
    }

    return env;
}

/**
 * Load environment variables from .env file
 * 
 * @param options Configuration options
 * @param options.filename Name of the .env file to load (default: '.env')
 * @param options.directory Directory to load from (default: process.cwd())
 * @param options.override Whether to override existing process.env variables (default: false)
 * @returns Parsed environment variables
 */
export async function loadEnvFile(options?: {
    filename?: string;
    directory?: string;
    override?: boolean;
}): Promise<Record<string, string>> {
    const {
        filename = '.env',
        directory = process.cwd(),
        override = false,
    } = options || {};

    const envPath = path.join(directory, filename);
    
    const exists = await fileExists(envPath);
    if (!exists) {
        return {};
    }

    try {
        const content = await fs.readFile(envPath, 'utf8');
        const parsed = parseEnvContent(content);

        // Set in process.env if not already set (or if override is true)
        for (const [key, value] of Object.entries(parsed)) {
            if (override || process.env[key] === undefined) {
                process.env[key] = value;
            }
        }

        return parsed;
    } catch {
        // Silently fail if .env file can't be read
        return {};
    }
}

/**
 * Load environment variables based on NODE_ENV
 * 
 * - Production/CLI: Loads .env
 * - Test: Loads .env.local (for local testing) or uses existing process.env
 * 
 * Priority: .env.local (test only) > process.env > .env (CLI only)
 */
export async function loadEnvironment(): Promise<void> {
    const isTest = process.env.NODE_ENV === 'test';

    if (isTest) {
        // In test mode, try to load .env.local for local development
        // This allows developers to test without committing credentials
        await loadEnvFile({ filename: '.env.local' });
    } else {
        // In CLI mode, load .env for user convenience
        await loadEnvFile({ filename: '.env' });
    }
}
