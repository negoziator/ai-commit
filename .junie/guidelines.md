# AI-Commit Developer Guidelines

## Project Overview
AI-Commit is a Node.js/TypeScript CLI tool that uses AI to generate meaningful git commit messages. It integrates with OpenAI's API and can be used directly or as a git hook.

## Tech Stack
- **Language**: TypeScript
- **Runtime**: Node.js (v20+)
- **Package Manager**: npm
- **Build Tool**: pkgroll (Rollup-based)
- **Testing Framework**: manten
- **CLI Parser**: cleye
- **AI Integration**: OpenAI API

## Project Structure
```
ai-commit/
├── src/                  # Source code
│   ├── cli.ts            # Main CLI entry point
│   ├── commands/         # Command implementations
│   │   ├── aicommit.ts   # Main commit message generation
│   │   ├── config.ts     # Configuration management
│   │   ├── hook.ts       # Git hook integration
│   │   └── prepare-commit-msg-hook.ts # Git prepare-commit-msg hook
│   └── utils/            # Utility functions
│       ├── config.ts     # Configuration utilities
│       ├── error.ts      # Error handling
│       ├── fs.ts         # File system operations
│       ├── git.ts        # Git operations
│       ├── openai.ts     # OpenAI API integration
│       └── prompt.ts     # User prompting utilities
├── tests/                # Test files
│   ├── fixtures/         # Test fixtures
│   ├── specs/            # Test specifications
│   │   ├── cli/          # CLI tests
│   │   ├── config.ts     # Configuration tests
│   │   └── git-hook.ts   # Git hook tests
│   ├── index.ts          # Main test entry point
│   └── utils.ts          # Test utilities
└── dist/                 # Build output (generated)
```

## Development Workflow

### Setup
1. Use nvm to set the correct Node.js version:
   ```
   nvm i
   ```
2. Install dependencies:
   ```
   npm i
   ```
3. Set up your OpenAI API key for testing:
   ```
   export OPENAI_KEY=<your-key>
   ```

### Building
- Build the project:
  ```
  npm run build
  ```
- Development mode (watch for changes):
  ```
  npm run build -- -w
  ```

### Testing
- Run all tests:
  ```
  npm test
  ```
- Run tests with OpenAI integration:
  ```
  OPENAI_KEY=<your-key> npm test
  ```

### Code Quality
- Type checking:
  ```
  npm run type-check
  ```
- Linting:
  ```
  npm run lint
  ```

### Running Locally
- After building, run the CLI:
  ```
  ./dist/cli.mjs
  ```
- Or with Node.js:
  ```
  node ./dist/cli.mjs
  ```

## Best Practices
1. **Code Organization**:
   - Keep command logic in the `commands/` directory
   - Place reusable utilities in the `utils/` directory
   - Maintain separation of concerns between UI, business logic, and external APIs

2. **Testing**:
   - Write tests for all new functionality
   - Mock external dependencies (especially OpenAI API) in tests
   - Use fixtures for test data

3. **Git Workflow**:
   - Create feature branches for new features
   - Use the tool itself to generate commit messages
   - Follow the contribution guidelines in CONTRIBUTING.md

4. **Configuration**:
   - Store user configuration in the `.aicommit` file
   - Use the config utilities for reading/writing configuration
