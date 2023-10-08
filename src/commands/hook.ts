import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { green, red } from 'kolorist'
import { command } from 'cleye'
import { assertGitRepo } from '../utils/git.js'
import { fileExists } from '../utils/fs.js'
import { KnownError, handleCliError } from '../utils/error.js'

const hookName = 'prepare-commit-msg'
const symlinkPath = `.git/hooks/${hookName}`

const hookPath = fileURLToPath(new URL('cli.mjs', import.meta.url))

export const isCalledFromGitHook = (
  process.argv[1]
    .replace(/\\/g, '/') // Replace Windows back slashes with forward slashes
    .endsWith(`/${symlinkPath}`)
)

const isWindows = process.platform === 'win32'
const windowsHook = `
#!/usr/bin/env node
import(${JSON.stringify(pathToFileURL(hookPath))})
`.trim()

export default command({
  name: 'hook',
  parameters: ['<install/uninstall>']
}, (argv) => {
  (async () => {
    const gitRepoPath = await assertGitRepo()
    const { installUninstall: mode } = argv._

    const absoltueSymlinkPath = path.join(gitRepoPath, symlinkPath)
    const hookExists = await fileExists(absoltueSymlinkPath)
    if (mode === 'install') {
      if (hookExists) {
        // If the symlink is broken, it will throw an error
        const realpath = await fs.realpath(absoltueSymlinkPath).catch(() => {})
        if (realpath === hookPath) {
          console.warn('The hook is already installed')
          return
        }
        throw new KnownError(`A different ${hookName} hook seems to be installed. Please remove it before installing aicommit.`)
      }

      await fs.mkdir(path.dirname(absoltueSymlinkPath), { recursive: true })

      if (isWindows) {
        await fs.writeFile(
          absoltueSymlinkPath,
          windowsHook
        )
      } else {
        await fs.symlink(hookPath, absoltueSymlinkPath, 'file')
        await fs.chmod(absoltueSymlinkPath, 0o755)
      }
      console.log(`${green('✔')} Hook installed`)
      return
    }

    if (mode === 'uninstall') {
      if (!hookExists) {
        console.warn('Hook is not installed')
        return
      }

      if (isWindows) {
        const scriptContent = await fs.readFile(absoltueSymlinkPath, 'utf8')
        if (scriptContent !== windowsHook) {
          console.warn('Hook is not installed')
          return
        }
      } else {
        const realpath = await fs.realpath(absoltueSymlinkPath)
        if (realpath !== hookPath) {
          console.warn('Hook is not installed')
          return
        }
      }

      await fs.rm(absoltueSymlinkPath)
      console.log(`${green('✔')} Hook uninstalled`)
      return
    }

    throw new KnownError(`Invalid mode: ${mode}`)
  })().catch((error) => {
    console.error(`${red('✖')} ${error.message}`)
    handleCliError(error)
    process.exit(1)
  })
})
