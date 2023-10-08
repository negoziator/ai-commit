<div align="center">
  <div>
    <h1 align="center">AI Commit</h1>
  </div>
	<p>A CLI that writes your git commit messages for you with AI. Never write a commit message again.</p>
	<a href="https://www.npmjs.com/package/@negoziator/ai-commit"><img src="https://img.shields.io/npm/v/@negoziator/ai-commit" alt="Current version"></a>
</div>

---

## Setup

> The minimum supported version of Node.js is the latest v14. Check your Node.js version with `node --version`.

1. Install _ai-commit_:

    ```sh
    npm install -g @negozitor/ai-commit
    ```

2. Retrieve your API key from [OpenAI](https://platform.openai.com/account/api-keys)

   > Note: If you haven't already, you'll have to create an account and set up billing.

3. Set the key so aicommit can use it:

    ```sh
    aicommit config set OPENAI_KEY=<your token>
    ```

   This will create a `.aicommit` file in your home directory.

### Upgrading

Check the installed version with:

```
aicommit --version
```

If it's not the [latest version](https://github.com/negoziator/aicommit/releases/latest), run:

```sh
npm update -g @negozitor/ai-commit
```

## Usage

### CLI mode

You can call `aicommit` directly to generate a commit message for your staged changes:

```sh
git add <files...>
aicommit
```

`aicommit` passes down unknown flags to `git commit`, so you can pass
in [`commit` flags](https://git-scm.com/docs/git-commit).

For example, you can stage all changes in tracked files with as you commit:

```sh
aicommit --all # or -a
```

> 👉**Tip:** Use the `aic` alias if `aicommit` is too long for you.

#### Generate multiple recommendations

Sometimes the recommended commit message isn't the best so you want it to generate a few to pick from. You can generate
multiple commit messages at once by passing in the `--generate <i>` flag, where 'i' is the number of generated messages:

```sh
aicommit --generate <i> # or -g <i>
```

> Warning: this uses more tokens, meaning it costs more.

#### Generating Conventional Commits

If you'd like to generate [Conventional Commits](https://conventionalcommits.org/), you can use the `--type` flag
followed by `conventional`. This will prompt `aicommit` to format the commit message according to the Conventional
Commits specification:

```sh
aicommit --type conventional # or -t conventional
```

This feature can be useful if your project follows the Conventional Commits standard or if you're using tools that rely
on this commit format.

### Git hook

You can also integrate _aicommit_ with Git via
the [`prepare-commit-msg`](https://git-scm.com/docs/githooks#_prepare_commit_msg) hook. This lets you use Git like you
normally would, and edit the commit message before committing.

#### Install

In the Git repository you want to install the hook in:

```sh
aicommit hook install
```

#### Uninstall

In the Git repository you want to uninstall the hook from:

```sh
aicommit hook uninstall
```

#### Usage

1. Stage your files and commit:
    ```sh
    git add <files...>
    git commit # Only generates a message when it's not passed in
    ```

   > If you ever want to write your own message instead of generating one, you can simply pass one
   in: `git commit -m "My message"`

2. aicommit will generate the commit message for you and pass it back to Git. Git will open it with
   the [configured editor](https://docs.github.com/en/get-started/getting-started-with-git/associating-text-editors-with-git)
   for you to review/edit it.

3. Save and close the editor to commit!

## Configuration

### Reading a configuration value

To retrieve a configuration option, use the command:

```sh
aicommit config get <key>
```

For example, to retrieve the API key, you can use:

```sh
aicommit config get OPENAI_KEY
```

You can also retrieve multiple configuration options at once by separating them with spaces:

```sh
aicommit config get OPENAI_KEY generate
```

### Setting a configuration value

To set a configuration option, use the command:

```sh
aicommit config set <key>=<value>
```

For example, to set the API key, you can use:

```sh
aicommit config set OPENAI_KEY=<your-api-key>
```

You can also set multiple configuration options at once by separating them with spaces, like

```sh
aicommit config set OPENAI_KEY=<your-api-key> generate=3 locale=en
```

### Options

#### OPENAI_KEY

Required

The OpenAI API key. You can retrieve it from [OpenAI API Keys page](https://platform.openai.com/account/api-keys).

#### locale

Default: `en`

The locale to use for the generated commit messages. Consult the list of codes
in: https://wikipedia.org/wiki/List_of_ISO_639-1_codes.

#### generate

Default: `1`

The number of commit messages to generate to pick from.

Note, this will use more tokens as it generates more results.

#### model

Default: `gpt-3.5-turbo`

The Chat Completions (`/v1/chat/completions`) model to use. Consult the list of models available in
the [OpenAI Documentation](https://platform.openai.com/docs/models/model-endpoint-compatibility).

> Tip: If you have access, try upgrading to [`gpt-4`](https://platform.openai.com/docs/models/gpt-4) for next-level code
> analysis. It can handle double the input size, but comes at a higher cost. Check out OpenAI's website to learn more.

#### timeout

The timeout for network requests to the OpenAI API in milliseconds.

Default: `10000` (10 seconds)

```sh
aicommit config set timeout=20000 # 20s
```

#### max-length

The maximum character length of the generated commit message.

Default: `50`

```sh
aicommit config set max-length=100
```

#### type

Default: `""` (Empty string)

The type of commit message to generate. Set this to "conventional" to generate commit messages that follow the
Conventional Commits specification:

```sh
aicommit config set type=conventional
```

You can clear this option by setting it to an empty string:

```sh
aicommit config set type=
```

#### auto-confirm

Default: `false`

Automatically confirm the generated commit message without prompting the user.

```sh
aicommit config set auto-confirm=true
```

## How it works

This CLI tool runs `git diff` to grab all your latest code changes, sends them to OpenAI's GPT-3, then returns the AI
generated commit message.

Video coming soon where I rebuild it from scratch to show you how to easily build your own CLI tools powered by AI.

## Maintainers

- **Lars Schou
  **: [@NegoZiatoR](https://github.com/NegoZiatoR) [<img src="https://img.shields.io/twitter/follow/negoziator?style=flat&label=negoziator&logo=twitter&color=0bf&logoColor=fff" align="center">](https://twitter.com/negoziator)

## Contributing

If you want to help fix a bug or implement a feature in [Issues](https://github.com/Nutlope/aicommit/issues), checkout
the [Contribution Guide](CONTRIBUTING.md) to learn how to setup and test the project.
