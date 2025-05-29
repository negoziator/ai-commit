import fs from 'fs/promises'
import path from 'path'
import { testSuite, expect } from 'manten'
import { createFixture } from '../utils.js'
import { spawn } from  "node:child_process";

export default testSuite(({ describe }) => {
  describe('config', async ({ test, describe }) => {
    const { fixture, aicommit } = await createFixture()
    const configPath = path.join(fixture.path, '.aicommit')
    const openAiToken = 'OPENAI_KEY=sk-abc'

    test('set unknown config file', async () => {
      const { stderr } = await aicommit(['config', 'set', 'UNKNOWN=1'], {
        reject: false
      })

      expect(stderr).toMatch('Invalid config property: UNKNOWN')
    })

    test('set invalid OPENAI_KEY', async () => {
      const { stderr } = await aicommit(['config', 'set', 'OPENAI_KEY=abc'], {
        reject: false
      })

      expect(stderr).toMatch('Invalid config property OPENAI_KEY: Must start with "sk-"')
    })

    await test('set config file', async () => {
      await aicommit(['config', 'set', openAiToken])

      const configFile = await fs.readFile(configPath, 'utf8')
      expect(configFile).toMatch(openAiToken)
    })

    await test('get config file', async () => {
      const { stdout } = await aicommit(['config', 'get', 'OPENAI_KEY'])
      expect(stdout).toBe(openAiToken)
    })

    await test('reading unknown config', async () => {
      await fs.appendFile(configPath, 'UNKNOWN=1')

      const { stdout, stderr } = await aicommit(['config', 'get', 'UNKNOWN'], {
        reject: false
      })

      expect(stdout).toBe('')
      expect(stderr).toBe('')
    })

    await describe('timeout', ({ test }) => {
      test('setting invalid timeout config', async () => {
        const { stderr } = await aicommit(['config', 'set', 'timeout=abc'], {
          reject: false
        })

        expect(stderr).toMatch('Must be an integer')
      })

      test('setting valid timeout config', async () => {
        const timeout = 'timeout=20000'
        await aicommit(['config', 'set', timeout])

        const configFile = await fs.readFile(configPath, 'utf8')
        expect(configFile).toMatch(timeout)

        const get = await aicommit(['config', 'get', 'timeout'])
        expect(get.stdout).toBe(timeout)
      })
    })

    await describe('max-length', ({ test }) => {
      test('must be an integer', async () => {
        const { stderr } = await aicommit(['config', 'set', 'max-length=abc'], {
          reject: false
        })

        expect(stderr).toMatch('Must be an integer')
      })

      test('must be at least 20 characters', async () => {
        const { stderr } = await aicommit(['config', 'set', 'max-length=10'], {
          reject: false
        })

        expect(stderr).toMatch(/must be greater than 20 characters/i)
      })

      test('updates config', async () => {
        const defaultConfig = await aicommit(['config', 'get', 'max-length'])
        expect(defaultConfig.stdout).toBe('max-length=50')

        const maxLength = 'max-length=60'
        await aicommit(['config', 'set', maxLength])

        const configFile = await fs.readFile(configPath, 'utf8')
        expect(configFile).toMatch(maxLength)

        const get = await aicommit(['config', 'get', 'max-length'])
        expect(get.stdout).toBe(maxLength)
      })
    })

    await describe('temperature', ({ test }) => {
      test('must be a decimal', async () => {
          const { stderr } = await aicommit(['config', 'set', 'temperature=abc'], {
              reject: false
          })

          expect(stderr).toMatch('Must be decimal between 0 and 2')
      })

      test('updates config', async () => {
          const defaultConfig = await aicommit(['config', 'get', 'temperature'])
          expect(defaultConfig.stdout).toBe('temperature=0.2')

          const temperature = 'temperature=0.7'
          await aicommit(['config', 'set', temperature])

          const configFile = await fs.readFile(configPath, 'utf8')
          expect(configFile).toMatch(temperature)

          const get = await aicommit(['config', 'get', 'temperature'])
          expect(get.stdout).toBe(temperature)
      })
    })

    await describe('auto-confirm', ({ test }) => {
      test('must be a boolean', async () => {
        const { stderr } = await aicommit(['config', 'set', 'auto-confirm=abc'], {
          reject: false
        })

        expect(stderr).toMatch('Must be a boolean')
      })

      test('updates config', async () => {
        const defaultConfig = await aicommit(['config', 'get', 'auto-confirm'])
        expect(defaultConfig.stdout).toBe('auto-confirm=false')

        const autoConfirm = 'auto-confirm=true'
        await aicommit(['config', 'set', autoConfirm])

        const configFile = await fs.readFile(configPath, 'utf8')
        expect(configFile).toMatch(autoConfirm)

        const get = await aicommit(['config', 'get', 'auto-confirm'])
        expect(get.stdout).toBe(autoConfirm)
      })
    })

    await describe('prepend-reference', ({ test }) => {
      test('must be a boolean', async () => {
          const { stderr } = await aicommit(['config', 'set', 'prepend-reference=abc'], {
              reject: false
          })

          expect(stderr).toMatch('Must be a boolean')
      })

      test('updates config', async () => {
          const defaultConfig = await aicommit(['config', 'get', 'prepend-reference'])
          expect(defaultConfig.stdout).toBe('prepend-reference=false')

          const autoConfirm = 'prepend-reference=true'
          await aicommit(['config', 'set', autoConfirm])

          const configFile = await fs.readFile(configPath, 'utf8')
          expect(configFile).toMatch(autoConfirm)

          const get = await aicommit(['config', 'get', 'prepend-reference'])
          expect(get.stdout).toBe(autoConfirm)
      })
    })

    await test('set config file', async () => {
      await aicommit(['config', 'set', openAiToken])

      const configFile = await fs.readFile(configPath, 'utf8')
      expect(configFile).toMatch(openAiToken)
    })

    await test('get config file', async () => {
      const { stdout } = await aicommit(['config', 'get', 'OPENAI_KEY'])
      expect(stdout).toBe(openAiToken)
    })

    await describe('project config precedence', ({ test }) => {
      test('project config takes precedence over global config', async () => {
        // Set global config
        await aicommit(['config', 'set', 'locale=en'])
        await aicommit(['config', 'set', 'model=gpt-4o-mini'])
        await aicommit(['config', 'set', 'max-length=50'])

        // Create project config with different values
        const projectConfig = {
          locale: 'fr',
          model: 'gpt-4',
          'max-length': '100'
        }

        await fixture.writeFile('.ai-commit.json', JSON.stringify(projectConfig))

        // No need to mock anything, the test will use the actual implementation

        // Create a test file that uses getConfig
        const testFile = `
          import { getConfig } from '../../src/utils/config.js'

          async function main() {
            const config = await getConfig()
            console.log(JSON.stringify(config))
          }

          main().catch(console.error)
        `

        await fixture.writeFile('test-config.js', testFile)

        // Run the test file
        const runTestFile = () => {
          return new Promise((resolve, reject) => {
            const process = spawn('node', ['test-config.js'], {
              cwd: fixture.path,
              stdio: ['inherit', 'pipe', 'inherit'], // Attach stdout only
            });

            let output = '';
            process.stdout.on('data', (data) => {
              output += data;
            });

            process.on('close', (code) => {
              if (code === 0) {
                resolve(output);
              } else {
                reject(new Error(`Process exited with code ${code}`));
              }
            });
          });
        };

        const stdout = await runTestFile() as string;
        const config = JSON.parse(stdout);

        // Verify that project config values take precedence
        expect(config.locale).toBe('fr');
        expect(config.model).toBe('gpt-4');
        expect(config['max-length']).toBe(100);
      })
    })

    await fixture.rm()
  })
})
