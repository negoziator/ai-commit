<div align="center">
    <h1>🤖 AI-Commit 🤖</h1>
    <img src="./.github/screenshot.png" alt="License" width="1000" height="300">
    <p>Your coding companion, ensures that every commit you make is meaningful, insightful, and contributing positively towards your development workflow.</p>
    <a href="https://www.npmjs.com/package/@negoziator/ai-commit"><img src="https://img.shields.io/npm/v/@negoziator/ai-commit" alt="Current version"></a>
</div>

---

## Table of Contents
- [Setup](#setup)
    - [Installation](#installation)
    - [Upgrading](#upgrading)
- [Usage](#usage)
    - [CLI Mode](#cli-mode)
- [Configuration](#configuration)
  - [Options](#options)
- [Maintainers](#maintainers)
- [Contributing](#contributing)

## Setup
> A minimum of Node v18 is required. Check your Node.js version with `node --version`.

### Installation
1. **Install AI-Commit:**
   ```sh
   npm install -g @negoziator/ai-commit

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
| `model`             | `gpt-3.5-turbo` | The Chat Completions model to use.                                                    |
| `timeout`           | `10000` ms      | Network request timeout to the OpenAI API.                                            |
| `max-length`        | `50`            | Maximum character length of the generated commit message.                             |
| `type`              | `""`            | Type of commit message to generate.                                                   |
| `auto-confirm`      | `false`         | Automatically confirm the generated commit message without user prompt.               |
| `prepend-reference` | `false`         | Prepend issue reference from branch name to commit message.                           |
| `temperature`       | `0.2`           | The temperature (0.0-2.0) is used to control the randomness of the output from OpenAI |

## Maintainers
- **Lars Schou**: <img src="https://img.shields.io/twitter/follow/negoziator?style=flat&label=negoziator&logo=twitter&color=0bf&logoColor=fff" align="center">

## Contributing
If you want to help fix a bug or implement a feature in [Issues](https://github.com/negoziator/ai-commit/issues), checkout
the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project.
