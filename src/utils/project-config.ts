import fs from 'fs/promises';
import path from 'path';
import { fileExists } from './fs.js';
import { assertGitRepo } from './git.js';
import { KnownError } from './error.js';

export interface ProjectConfig {
  projectPrompt?: string;
}

/**
 * Reads and parses the .ai-commit.json file from the project root.
 * Returns undefined if the file doesn't exist.
 *
 * @param repoRootPath Optional path to the repository root. If not provided, it will be determined using assertGitRepo().
 */
export const getProjectConfig = async (repoRootPath?: string): Promise<ProjectConfig | undefined> => {
  try {
    const repoRoot = repoRootPath || await assertGitRepo();
    const configPath = path.join(repoRoot, '.ai-commit.json');

    const configExists = await fileExists(configPath);
    if (!configExists) {
      return undefined;
    }

    const configString = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configString) as ProjectConfig;

    return config;
  } catch (error) {
    if (error instanceof KnownError) {
      throw error;
    }

    // If there's an error parsing the file, return undefined
    return undefined;
  }
};
