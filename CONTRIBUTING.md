# How to contribute

## Setting up a dev environment

Setting up the repo:

1. **Clone** the repo with `git clone git@github.com:jerzakm/threejs-kit.git`
2. **Install** the packages by running `pnpm install` in the root of the repo
3. **Develop** by running `pnpm run dev`

Some editor tooling:

1. **Editor Configuration**: install the [`editorconfig`](https://editorconfig.org/) extension for your editor.
2. **VSCode Users**: install the recommended extensions.

## Commiting changes

Three.js-kit uses Git for version control and [Changesets](https://github.com/changesets/changesets) for release notes. You will need to understand our conventions with both to commit changes.

### Git commits

We don't have a strict commit message policy. Here are some best practices:

- **Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/)** to make it easier to read your commit message.
- **Go into technical details** if necessary to allow maintainers to understand the context of the change.

### Changesets

[Changesets](https://github.com/changesets/changesets) is a tool that helps us keep a changelog for all the packages in the monorepo and aggregate them into release notes.

To add a changeset:

1. **Run the command** `npx changeset` in your terminal
2. **Select packages** affected by your change; we have a dedicated package for the docs.
3. **Classify the change** as major, minor, or patch for each selected package.
4. **Write the changelog** as detailing WHAT the change is, WHY it was made, and HOW it affects the users.
5. **Commit the changeset file** to your Git branch so that it appears in your PR.

Make an effort to write the changelog well, because our users see this in the release notes. Provide enough detail to be clear, but keep things as concise as possible. If migration steps are required, detail them here.

A detailed guide on adding changesets can be [found here](https://github.com/changesets/changesets/blob/main/docs/adding-a-changeset.md).
