const Git = require('git-shizzle');
const dotfig = require('dotfig');
const Repo = require('./repo');
const path = require('path');
const fs = require('fs');

/**
 * Mono tools.
 *
 * @param {String} root Absolute location of the root of the mono repo.
 * @param {Object} options Default configuration for various of package methods.
 * @public
 */
class Mono {
  constructor(root, options) {
    this.root = root;
    this.options = Object.assign(dotfig('mono') || {}, options || {});

    this.git = new Git(root);
    this.repos = path.join(this.root, 'packages');
  }

  /**
   * Get a project instance.
   *
   * @returns {Repo} The repo instance.
   * @public
   */
  repo(name) {
    return new Repo(this, name);
  }

  /**
   * Resolve a repo based on the name.
   *
   * @param {String} name Name of the project.
   * @returns {String} The location of package.
   * @public
   */
  resolve(name) {
    return path.join(this.repos, name);
  }

  /**
   * Verify if we're allowed to release the current state of the project.
   *
   * @returns {Boolean} Indication of success.
   * @public
   */
  verify() {
    const uptodate = this.git.pull('--dry-run');

    if (update && !~uptodate.indexOf('Already up-to-date.')) {
      warnings.write([
        'You need to pull from the remote before continuing',
        '',
        `Run 'git pull origin master'`
      ]);

      return false;
    }

    return true;
  }

  /**
   * Iterate over all known packages.
   *
   * @param {Function|String} iterate Iterater or function name to execute.
   * @returns {Mono} Chaining.
   * @public
   */
  each(iterate, ...args) {
    const folders = fs.readdirSync(this.repos).filter((file) => {
      return fs.lstatSync(path.join(this.repos, file)).isDirectory();
    });

    let success = true;

    folders.every((folder) => {
      const repo = new Repo(this, folder);
      let yayornay;

      if ('function' === typeof iterate) {
        yayornay = iterate(repo);
      } else {
        yayornay = repo[iterate](...args);
      }

      if ('boolean' === typeof yayornay) success = yayornay;
      return success;
    });

    return success;
  }

  /**
   * Get all the package.json names from our repos.
   *
   * @returns {Array} Names of the packages.
   * @public
   */
  packages() {
    const result = [];

    this.each((repo) => {
      result.push(repo.read().name);
    });

    return result;
  }

  /**
   * Publish a new version of all packages.
   *
   * @returns {Boolean} Indication of success.
   * @public
   */
  publish(...args) {
    return this.each('publish', ...args);
  }

  /**
   * Run the test suites of all packages.
   *
   * @returns {Boolean} Indication of success.
   * @public
   */
  test(...args) {
    return this.each('test', ...args);
  }

  /**
   * Install all the dependencies of all projects.
   *
   * @returns {Boolean} Indication of success.
   * @public
   */
  install(...args) {
    return this.each('install', ...args);
  }

  /**
   * Symlink all packages together.
   *
   * @returns {Boolean} Indication of success.
   * @public
   */
  link(...args) {
    return this.each('link', ...args);
  }
}

//
// Expose the Mono instance.
//
module.exports = Mono;
