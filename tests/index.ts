import { describe } from 'manten'

describe('aicommit', ({ runTestSuite }) => {
  runTestSuite(import('./specs/cli/index.js'))
  runTestSuite(import('./specs/config.js'))
  runTestSuite(import('./specs/git-hook.js'))
  runTestSuite(import('./specs/project-config.js'))
})
