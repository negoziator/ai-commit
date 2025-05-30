import { testSuite, expect } from 'manten';
import { createFixture } from '../utils.js';
import { getProjectConfig } from '../../src/utils/project-config.js';

export default testSuite(({ describe }) => {
  describe('project-config', async ({ test }) => {
    test('getProjectConfig returns undefined when .ai-commit.json does not exist', async () => {
      const { fixture } = await createFixture();

      const config = await getProjectConfig(fixture.path);
      expect(config).toBeUndefined();

      await fixture.rm();
    });

    test('getProjectConfig reads and parses .ai-commit.json with projectPrompt', async () => {
      const { fixture } = await createFixture();

      // Create .ai-commit.json file with projectPrompt
      const projectPrompt = 'This is a test project that manages JSON data files.';
      await fixture.writeFile('.ai-commit.json', JSON.stringify({
        projectPrompt
      }));

      const config = await getProjectConfig(fixture.path);
      expect(config).toBeDefined();
      expect(config?.projectPrompt).toBe(projectPrompt);

      await fixture.rm();
    });

    test('getProjectConfig reads and parses .ai-commit.json with all config keys', async () => {
      const { fixture } = await createFixture();

      // Create .ai-commit.json file with all config keys
      const projectConfig = {
        projectPrompt: 'This is a test project that manages JSON data files.',
        OPENAI_KEY: 'sk-test123',
        locale: 'fr',
        generate: '2',
        type: 'conventional',
        model: 'gpt-4',
        timeout: '15000',
        temperature: '0.5',
        'max-length': '100',
        'max-completion-tokens': '5000',
        'auto-confirm': true,
        'prepend-reference': true
      };

      await fixture.writeFile('.ai-commit.json', JSON.stringify(projectConfig));

      const config = await getProjectConfig(fixture.path);
      expect(config).toBeDefined();
      expect(config?.projectPrompt).toBe(projectConfig.projectPrompt);
      expect(config?.OPENAI_KEY).toBe(projectConfig.OPENAI_KEY);
      expect(config?.locale).toBe(projectConfig.locale);
      expect(config?.generate).toBe(projectConfig.generate);
      expect(config?.type).toBe(projectConfig.type);
      expect(config?.model).toBe(projectConfig.model);
      expect(config?.timeout).toBe(projectConfig.timeout);
      expect(config?.temperature).toBe(projectConfig.temperature);
      expect(config?.['max-length']).toBe(projectConfig['max-length']);
      expect(config?.['max-completion-tokens']).toBe(projectConfig['max-completion-tokens']);
      expect(config?.['auto-confirm']).toBe(projectConfig['auto-confirm']);
      expect(config?.['prepend-reference']).toBe(projectConfig['prepend-reference']);

      await fixture.rm();
    });

    test('getProjectConfig handles invalid JSON', async () => {
      const { fixture } = await createFixture();

      // Create invalid .ai-commit.json file
      await fixture.writeFile('.ai-commit.json', 'invalid json');

      const config = await getProjectConfig(fixture.path);
      expect(config).toBeUndefined();

      await fixture.rm();
    });
  });
});
