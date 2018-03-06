# mono-repos

Highly opinionated set of utilities to orchestrate and administrate mono
repositories.

The `mono-repos` project assumes the following:

- Packages live in the `packages` folder in the root of the repository.
- Each package has their own individual version number.
- A publish should be easy trackable in Github, using `tags`.

## Table of Contents

- [Installation](#installation)
- [Usage](#Usage)
  - [CLI](#cli)
  - [Repo](#repo)
    - [publish](#publish)
    - [install](#install)
    - [test](#test)
    - [link](#link)

## Installation

This library should be installed as `devDependency` in the **root** of your
mono repository.

```
npm install --save-dev mono-repo
```

## Usage

```js
const Mono = require('mono-repos');
```

The `mono` constructor accepts 2 arguments:

- `root` This is the absolute path to the root of the mono repository.
- `options` Default configuration for the projects.

```js
const mono = new Mono(process.cwd(), {
  // options here
});
```

### CLI

The project comes with a build-in CLI called `mono`. This provides some basic
repo management utilities such as (mass and targeted) publish, test, link and
installation.

```
mono:help:
mono:help: mono(-repos): Mono repo management made easy
mono:help:
mono:help: usage: mono [flags]
mono:help:
mono:help: The following flags are supported:
mono:help:
mono:help: --publish [name]         Publish all packages, when a name is given only release
mono:help:                          that given package instead of all packages.
mono:help:      --release [type]    Type of release, either `patch`, `minor` or `major`.
mono:help:      --version [semver]  Instead of an automated bump, release the specified version.
mono:help: --test [name]            Run the test suite, all, or for the given name.
mono:help: --link [name]            npm link packages, all, or for the given name.
mono:help: --install [name]         npm install dependencies, all, or for the given name.
mono:help:
mono:help: examples:
mono:help:   mono --publish foo --release patch
mono:help:   mono --install && mono --link
mono:help:
```

### Repo

The `Repo` class represents a single package from the `packages` folder. The
package has the following methods available:

- [publish](#publish)
- [install](#install)
- [test](#test)
- [link](#link)

#### publish

Publish a new version of the package. The process will start the following
operations in the package:

- Bump the version number of the `package.json` file.
- Create a new `[dist] ${name}@${version}` commit.
- Create a new git tag `${name}@${version}`.
- Push tags, and commit to the current branch.
- Run `npm publish` to publish the version to `npm`.

```js
const project = mono.repo('name of project');

project.publish({ release: 'patch' });
```

The method accepts an optional object with the following keys:

- `release` Type of version bump we want to do, can either be `patch`, `minor`
  or `major`.
- `version` Instead of an automated version bump, bump the project to the
  specified version number.
- `message` Additional commit message.

If no options are provided, it will use the options object that was originally
provided to the `mono` instance.

#### install

Install all the dependencies of the given project.

```js
const project = mono.repo('name of project');

project.install();
```

#### test

Run the test of a given project.

```js
const project = mono.repo('name of project');

project.test();
```

#### link

Symlink all projects from the `packages` folder if we have a `dependency` or
`devDependency` on them.

```js
const project = mono.repo('name of project');

project.link();
```
