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
- [LLM Providers](#llm-providers)
    - [OpenAI (Default)](#openai-default)
    - [Anthropic Claude](#anthropic-claude)
    - [Azure OpenAI](#azure-openai)
    - [Ollama (Local)](#ollama-local)
    - [Custom/RAG](#customrag)
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
- 🔌 **Multiple LLM Providers**: Choose from OpenAI, Anthropic, Azure OpenAI, Ollama, or custom endpoints

## Setup
> A minimum of Node v20 is required. Check your Node.js version with `node --version`.

### Installation
1. **Install AI-Commit:**
   ```sh
   npm install -g @negoziator/ai-commit
   ```

2. **Choose and configure your LLM provider:**

   **Option A: OpenAI (Default)**
   ```sh
   aicommit config set OPENAI_KEY=<your-api-key>
   ```
   Get your API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)

   **Option B: Anthropic Claude**
   ```sh
   aicommit config set provider=anthropic
   aicommit config set ANTHROPIC_KEY=<your-api-key>
   ```
   Get your API key from [Anthropic Console](https://console.anthropic.com/)

   **Option C: Ollama (Local, Free)**
   ```sh
   # Install Ollama from https://ollama.com, then:
   ollama pull llama3.2
   aicommit config set provider=ollama
   aicommit config set model=llama3.2
   ```

   **Option D: Azure OpenAI**
   ```sh
   aicommit config set provider=azure-openai
   aicommit config set AZURE_OPENAI_KEY=<your-key>
   aicommit config set AZURE_ENDPOINT=<your-endpoint>
   ```

   See the [LLM Providers](#llm-providers) section for more options and details.

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

## LLM Providers

AI-Commit supports multiple LLM providers, allowing you to choose the best option for your needs.

### OpenAI (Default)

The default provider using OpenAI's GPT models.

**Setup:**
```sh
aicommit config set OPENAI_KEY=<your-api-key>
```

**Recommended models:**
- `gpt-4o-mini` (default, fast and cost-effective)
- `gpt-4o` (more capable, higher cost)
- `gpt-4-turbo`

**Get your API key:** [OpenAI Platform](https://platform.openai.com/account/api-keys)

---

### Anthropic Claude

Use Anthropic's Claude models as an alternative to OpenAI.

**Setup:**
```sh
aicommit config set provider=anthropic
aicommit config set ANTHROPIC_KEY=<your-api-key>
```

**Recommended models:**
- `claude-3-5-sonnet-20241022` (recommended, best balance)
- `claude-3-opus-20240229` (most capable)
- `claude-3-haiku-20240307` (fastest, most economical)

**Get your API key:** [Anthropic Console](https://console.anthropic.com/)

---

### Azure OpenAI

Use Azure's OpenAI Service for enterprise deployments.

**Setup:**
```sh
aicommit config set provider=azure-openai
aicommit config set AZURE_OPENAI_KEY=<your-api-key>
aicommit config set AZURE_ENDPOINT=<your-endpoint>
```

**Example endpoint:** `https://your-resource.openai.azure.com`

**Note:** The `model` config should match your Azure deployment name.

**Learn more:** [Azure OpenAI Service](https://azure.microsoft.com/en-us/products/ai-services/openai-service)

---

### Ollama (Local)

Run AI-Commit completely offline using local models via Ollama.

**Setup:**
```sh
# 1. Install Ollama from https://ollama.com
# 2. Pull a model
ollama pull llama3.2

# 3. Configure AI-Commit
aicommit config set provider=ollama
aicommit config set model=llama3.2
```

**Recommended models:**
- `llama3.2` (recommended, good balance)
- `codellama` (optimized for code)
- `mistral` (fast and capable)
- `qwen2.5-coder` (specialized for coding)

**Default endpoint:** `http://localhost:11434` (automatically configured)

**Benefits:**
- ✅ Completely free
- ✅ Works offline
- ✅ Privacy-focused (data never leaves your machine)
- ✅ No API key required

---

### Custom/RAG

Connect to custom LLM endpoints, RAG systems, or OpenAI-compatible APIs.

**Setup:**
```sh
aicommit config set provider=custom
aicommit config set CUSTOM_ENDPOINT=<your-endpoint-url>
aicommit config set CUSTOM_KEY=<optional-api-key>
```

**Compatible with:**
- Custom RAG implementations
- LM Studio
- LocalAI
- Text Generation WebUI
- vLLM
- Any OpenAI-compatible API

**Example:**
```sh
aicommit config set provider=custom
aicommit config set CUSTOM_ENDPOINT=https://my-rag.example.com/v1/chat/completions
aicommit config set model=my-custom-model
```

---

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

#### General Options

| Option              | Default         | Description                                                                           |
|---------------------|-----------------|---------------------------------------------------------------------------------------|
| `provider`          | `openai`        | LLM provider to use (`openai`, `anthropic`, `azure-openai`, `ollama`, `custom`)      |
| `locale`            | `en`            | Locale for the generated commit messages                                              |
| `generate`          | `1`             | Number of commit messages to generate                                                 |
| `model`             | `gpt-4o-mini`   | The model to use (provider-specific)                                                  |
| `timeout`           | `10000`         | Network request timeout in milliseconds                                               |
| `max-length`        | `50`            | Maximum character length of the generated commit message                              |
| `type`              | `""`            | Type of commit message to generate (`conventional` or empty)                          |
| `auto-confirm`      | `false`         | Automatically confirm the generated commit message without user prompt                |
| `prepend-reference` | `false`         | Prepend issue reference from branch name to commit message                            |
| `temperature`       | `0.2`           | Temperature (0.0-2.0) to control randomness of the output                             |
| `max-completion-tokens` | `10000`     | Maximum number of tokens that can be generated in the completion                      |
| `proxy`             | N/A             | HTTPS proxy URL (e.g., `http://proxy.example.com:8080`)                              |

#### Provider-Specific Options

| Option              | Provider        | Description                                                                           |
|---------------------|-----------------|---------------------------------------------------------------------------------------|
| `OPENAI_KEY`        | OpenAI          | OpenAI API key (starts with `sk-`)                                                    |
| `ANTHROPIC_KEY`     | Anthropic       | Anthropic API key (starts with `sk-ant-`)                                             |
| `AZURE_OPENAI_KEY`  | Azure OpenAI    | Azure OpenAI API key                                                                  |
| `AZURE_ENDPOINT`    | Azure OpenAI    | Azure OpenAI endpoint URL (e.g., `https://your-resource.openai.azure.com`)           |
| `OLLAMA_ENDPOINT`   | Ollama          | Ollama server endpoint (default: `http://localhost:11434`)                            |
| `CUSTOM_ENDPOINT`   | Custom          | Custom API endpoint URL                                                               |
| `CUSTOM_KEY`        | Custom          | Custom API key (optional, for endpoints requiring authentication)                     |

### Project-Specific Configuration

You can add a `.ai-commit.json` file in the root of your project to provide additional context about your project to the AI and to override global configuration settings for the specific project.

**Example with OpenAI:**
```json
{
  "projectPrompt": "This is a Node.js CLI tool that uses AI to generate meaningful git commit messages.",
  "model": "gpt-4o",
  "locale": "en",
  "max-length": "100",
  "temperature": "0.5"
}
```

**Example with Anthropic:**
```json
{
  "provider": "anthropic",
  "ANTHROPIC_KEY": "sk-ant-...",
  "model": "claude-3-5-sonnet-20241022",
  "projectPrompt": "This is a TypeScript library for data validation.",
  "max-length": "80"
}
```

**Example with Ollama:**
```json
{
  "provider": "ollama",
  "model": "codellama",
  "projectPrompt": "This is a Python web application using FastAPI.",
  "temperature": "0.3"
}
```

The `.ai-commit.json` file can contain any of the configuration options listed in the [Options](#options) section. Values set in this file will take precedence over the global configuration.

The `projectPrompt` field should contain a brief description of your project, its purpose, and any other relevant information that would help the AI understand the context of your code changes.

## Maintainers
[![NegoZiatoR](https://img.shields.io/badge/NegoZiatoR-blue?style=flat&logo=x&link=https://twitter.com/negoziator)](https://twitter.com/negoziator)

## Contributing
If you want to help fix a bug or implement a feature in [Issues](https://github.com/negoziator/ai-commit/issues), checkout
the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project.
