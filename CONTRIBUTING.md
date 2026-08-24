# Contributing to nestjs-aop

We welcome contribution from everyone in the community. <br/>
All communications in this repo will be by English.

> Every contributor to Slash libraries should adhere to our Code of Conduct. 
> <br/>Please read the [full text](.github/CODE_OF_CONDUCT.md) to understand what actions will and will not be tolerated.


## 1. Issues

You can contribute to Slash libraries via:

- Improving our [docs](README.md)
- [Reporting a bug in our issues tab](https://github.com/toss/nestjs-aop/issues/new/choose)
- [Requesting a new feature or package](https://github.com/toss/nestjs-aop/issues/new/choose)
- [Having a look at our issue list](https://github.com/toss/nestjs-aop/issues) to see what's to be fixed


## 2. Pull Requests
> [Opening a pull request](https://github.com/toss/nestjs-aop/compare) <br/>

You can raise your own PR. The title of your PR should match the following format:

```
<type>: <description>
```

> We do not care about the number, or style of commits in your history, because we squash merge every PR into the base branch (`main`). <br/> 
> Feel free to commit in whatever style you feel comfortable with.

### 2.1 Type

**Type must be one of those**

if you changed shipped code :
- feat - for any new functionality additions
- fix, refactor - for any fixes or refactors that don't add new functionality

if you haven't changed shipped code :
- docs - if you only change documentation
- test - if you only change tests

other :
- chore - anything else

### 2.2 Changeset

If your PR changes shipped code (`feat`/`fix`/`refactor`), run:

```
pnpm changeset
```

and pick the version bump (`patch`/`minor`/`major`) plus a short summary — that summary becomes the changelog entry for your change. `docs`/`test`/`chore` PRs usually don't need one.

> Merged changesets pile up into an auto-updated "Version Packages" PR. Merging **that** PR is what actually publishes to npm — so several of your PRs can land on `main` and go out together as one release, and PRs without a changeset never trigger a release at all.

### 2.3 Description

A clear and concise description of what the pr is about.



