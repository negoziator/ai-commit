<div align="center">
    <h1>🤖 AI-Commit 🤖</h1>
    <img src="./.github/screenshot.png" alt="License" width="1000" height="300">
    <p>A powerful CLI tool that uses AI to generate meaningful, insightful git commit messages based on your code changes.</p>
    <a href="https://www.npmjs.com/package/@negoziator/ai-commit"><img src="https://img.shields.io/npm/v/@negoziator/ai-commit" alt="Current version"></a>
</div>

---

## Table of Contents
- [Features](#features)
- [Setup](#setup)
    - [Installation](#installation)
    - [Upgrading](#upgrading)
- [Usage](#usage)
    - [CLI Mode](#cli-mode)
    - [Git Hook Integration](#git-hook-integration)
- [Configuration](#configuration)
    - [Options](#options)
    - [Project-Specific Configuration](#project-specific-configuration)
- [Maintainers](#maintainers)
- [Contributing](#contributing)

## Features

- 🤖 **AI-Powered Commits**: Generates meaningful commit messages based on your code changes
- 🔄 **Git Integration**: Works seamlessly with your existing Git workflow
- 🪝 **Git Hook Support**: Can be installed as a Git hook for automatic message generation
- 🌐 **Multiple Languages**: Supports commit messages in different locales
- ⚙️ **Customizable**: Configure the AI model, message length, and other parameters
- 📝 **Project Context**: Add project-specific context to improve message relevance

## Setup
> A minimum of Node v20 is required. Check your Node.js version with `node --version`.

### Installation
1. **Install AI-Commit:**
   ```sh
   npm install -g @negoziator/ai-commit
   ```

2. **Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys)**

   > Note: This requires an OpenAI account. If you don't have one, you can sign up for a free trial.

3. **Set the key so aicommit can use it:**

   ```sh
   aicommit config set OPENAI_KEY=<your token>
   ```

   This will create a `.aicommit` file in your home directory.

### Upgrading

```sh
npm update -g @negoziator/ai-commit
```

## Usage

### CLI Mode

Use `aicommit` directly to generate a commit message for your staged changes:

```sh
git add <files...>
aicommit
```

Example workflow:
```
$ git add .
$ aicommit
✓ Analyzing your changes...
✓ Generating commit message...

AI-generated commit message:
feat: add project-specific configuration support via .ai-commit.json

? Use this message? › (Y/n)
```

### Git Hook Integration

You can set up AI-Commit as a Git hook to automatically generate commit messages:

```sh
# Install the prepare-commit-msg hook
aicommit hook install
```

This will add a Git hook that automatically suggests commit messages when you run `git commit`.

To uninstall the hook:

```sh
aicommit hook uninstall
```

## Configuration
Manage configuration using the `aicommit config` command.

To get a configuration option value, use the command:

```sh
aicommit config get <key>
```
For example, to retrieve the API key, you can use:

```sh
aicommit config get OPENAI_KEY
> sk_1234567890
```

To set a configuration option, use the command:

```sh
aicommit config set <key>=<value>
```

### Options

| Option              | Default         | Description                                                                           |
|---------------------|-----------------|---------------------------------------------------------------------------------------|
| `OPENAI_KEY`        | N/A             | The OpenAI API key.                                                                   |
| `locale`            | `en`            | Locale for the generated commit messages.                                             |
| `generate`          | `1`             | Number of commit messages to generate.                                                |
| `model`             | `gpt-4o-mini`   | The Chat Completions model to use.                                                    |
| `timeout`           | `10000` ms      | Network request timeout to the OpenAI API.                                            |
| `max-length`        | `50`            | Maximum character length of the generated commit message.                             |
| `type`              | `""`            | Type of commit message to generate.                                                   |
| `auto-confirm`      | `false`         | Automatically confirm the generated commit message without user prompt.               |
| `prepend-reference` | `false`         | Prepend issue reference from branch name to commit message.                           |
| `temperature`       | `0.2`           | The temperature (0.0-2.0) is used to control the randomness of the output from OpenAI |
| `max-completion-tokens` | `10000`         | Maximum number of tokens that can be generated in the completion                      |

### Project-Specific Configuration

You can add a `.ai-commit.json` file in the root of your project to provide additional context about your project to the AI and to override global configuration settings for the specific project.

Example `.ai-commit.json`:
```json
{
  "projectPrompt": "This is a Node.js CLI tool that uses OpenAI to generate meaningful git commit messages.",
  "model": "gpt-4",
  "locale": "en",
  "max-length": "100",
  "temperature": "0.5",
  "max-completion-tokens": "5000"
}
```

The `.ai-commit.json` file can contain any of the configuration options listed in the [Options](#options) section. Values set in this file will take precedence over the global configuration.

The `projectPrompt` field should contain a brief description of your project, its purpose, and any other relevant information that would help the AI understand the context of your code changes.

## Maintainers
[![NegoZiatoR](https://img.shields.io/badge/NegoZiatoR-blue?style=flat&logo=x&link=https://twitter.com/negoziator)](https://twitter.com/negoziator)

## Contributing
If you want to help fix a bug or implement a feature in [Issues](https://github.com/negoziator/ai-commit/issues), checkout
the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project.
