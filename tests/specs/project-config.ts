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

    test('getProjectConfig reads and parses .ai-commit.json', async () => {
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
