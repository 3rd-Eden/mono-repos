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
  - [mono.root](#monoroot)
  - [mono.git](#git)
  - [mono#repo](#monorepo)
  - [mono#resolve](#monoresolve)
  - [mono#verify](#monoverify)
  - [mono#each](#monoeach)
  - [mono#packages](#monopackages)
  - [mono#publish](#monopublish)
  - [mono#install](#monoinstall)
  - [mono#link](#monolink)
- [CLI](#cli)
- [Repo](#repo)
  - [publish](#publish)
  - [install](#install)
  - [test](#test)
  - [link](#link)
- [License](#license)

## Installation

This library should be installed as `devDependency` in the **root** of your
mono repository.

```
npm install --save-dev mono-repos
```

But as it ships with a CLI tool it can also be installed globally.

```
npm install --global mono-repos
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

The `mono` instance has the following methods and properties available:

- [mono.root](#monoroot)
- [mono.git](#git)
- [mono#repo](#monorepo)
- [mono#resolve](#monoresolve)
- [mono#verify](#monoverify)
- [mono#each](#monoeach)
- [mono#packages](#monopackages)
- [mono#publish](#monopublish)
- [mono#install](#monoinstall)
- [mono#link](#monolink)
- [mono#test](#monotest)

### mono.root

This is the absolute path to where the mono repository is located

```js
console.log(mono.root);
```

### mono.git

A pre-configured `git-shizzle` cli wrapper for interacting with the git
repository.

```js
console.log(mono.git.changes()) // lists all unstaged changes
```

### mono#repo

Returns a new [Repo](#repo) instance for a given package name. The name should
be a name of a folder which is in the `/packages` folder.

```js
const repo = mono.repo('package-name');
```

See [Repo](#repo) for the available methods on the repo instance.

### mono#resolve

Helper function to resolve the path package. It basically joins the name given
name with `mono.root` and the known `packages` folder.

```js
const loc = mono.resolve('package-name');
console.log(loc); // /current/working-directory/packages/package-name
```

### mono#verify

Verifies that the repo is in a good state to publish. Returns a boolean as
success indication.

```js
mono.verify();
```

### mono#each

Iterates over all packages in the `/packages` folder. It accepts a function or
a string as first argument. When it's a function, it assumes it's an iterator
function. This function will receive a [Repo](#repo) instance as first argument.

When a string is supplied it will assume it's a method name that needs be called
on the [Repo](#repo) instance. Any other argument supplied to the `mono#each`
method will then be used as argument for the method.

```js
mono.each('publish'); // iterates over all packages, calls repo#publish on all.

//
// Same as above, but then passes the object in to the repo#publish method
//
mono.each('publish', { release: 'major' });

//
// Which are all short hands for writing:
//
mono.each(function each(repo) {
  return repo.publish();
});
```

It's worth noting that the `mono#each` method will stop iterating over the
packages when you return a `false` in the callback. This is useful for cases
when you do not want to continue publishing when an error occurs etc.

### mono#packages

Returns an array with the names of the npm packages that are hosted in the
`/packages` folder.

```js
mono.packages(); // ["package-name", "another", ..]
```

### mono#install

Install the dependencies of all the package.

```js
mono.install()
```

This is a shorthand method for;

```js
mono.each('install');
```

### mono#publish

Publishes all the packages.

```js
mono.publish({
  release: 'major',
  message: 'optional commit message, see Repo#publish for more information'
})
```

This is a shorthand method for:

```js
mono.each('publish');
```

### mono#link

Setups the symlinks of in the `node_module` folders of all packages.

```js
mono.link();
```

This is a shorthand method for:

```js
mono.each('link');
```

### mono#test

Run all the tests.

```js
mono.test();
```

This is a shorthand method for:

```js
mono.each('test');
```

## CLI

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

## Repo

The `Repo` class represents a single package from the `packages` folder. The
package has the following methods and properties are available:

- [repo.name](#reponame)
- [repo.root](#reporoot)
- [repo.npm](#reponpm)
- [repo#configure](#repoconfigure)
- [repo#read](#reporead)
- [repo#publish](#repopublish)
- [repo#install](#repoinstall)
- [repo#test](#repotest)
- [repo#link](#repolink)

### repo#name

The name of the package. This corresponds with the folder name in `/packages`

```js
const repo = mono.repo('package-name');

console.log(repo.name); // package-name
```

### repo#root

The absolute path to the package folder

```js
const repo = mono.repo('package-name');

console.log(repo.root); // /root/folder/packages/package-name
```

### repo#npm

Pre-configured `npm-shizzle` cli wrapper that only operates in the package
folder.

```js
const repo = mono.repo('package-name');

repo.npm.install('--save', 'diagnostics');
```

The snippet above will save a new dependency in the `package.json` of the file.

### repo#configure

Merges the provided options with the options that were origionally provided to
the `mono` instance. This allows you to supply defaults options to the [mono](#mono)
instance. This method used by all repo methods that accept options.

```js
const mono = new Mono(process.cwd(), {
  foo: 'bar',
  bar: 'baz'
});

const repo = mono.repo('hello world');

const options = repo.configure({ bar: 'hi', release: 'major' });

// options is now: { foo: 'bar', bar: 'hi', release: 'major' }
```

### repo#read

Read out the `package.json` of the package.

```js
const repo = mono.repo('package-name');

const data = repo.read();
console.log(data.version, data.dependencies);
```

### repo#publish

Publish a new version of the package. The process will start the following
operations in the package:

- Bump the version number of the `package.json` file.
- Create a new `[dist] ${name}@${version}` commit.
- Create a new git tag `${name}@${version}`.
- Push tags, and commit to the current branch.
- Run `npm publish` to publish the version to `npm`.

```js
const repo = mono.repo('name of project');

repo.publish({ release: 'patch' });
```

The method accepts an optional object with the following keys:

- `release` Type of version bump we want to do, can either be `patch`, `minor`
  or `major`.
- `version` Instead of an automated version bump, bump the project to the
  specified version number.
- `message` Additional commit message.

If no options are provided, it will use the options object that was originally
provided to the `mono` instance.

### repo#install

Install all the dependencies of the given project.

```js
const repo = mono.repo('name of project');

repo.install();
```

### repo#test

Run the test of a given project.

```js
const repo = mono.repo('name of project');

repo.test();
```

### repo#link

Symlink all projects from the `packages` folder if we have a `dependency` or
`devDependency` on them.

```js
const repo = mono.repo('name of project');

repo.link();
```

## License

The project is released under the MIT license
