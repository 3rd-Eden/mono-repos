const NPM = require('npm-shizzle');
const path = require('path');
const fs = require('fs');

/**
 * Representation of a single repo.
 *
 * @param {Mono} mono Reference to the wrapping mono instance.
 * @param {String} name Name of the repo we represent.
 * @param {Object} options Additional configuration.
 * @public
 */
class Repo {
  constructor(mono, name) {
    this.mono = mono;
    this.name = name;

    const options = this.configure();

    this.root = mono.resolve(this.name);
    this.npm = new NPM(this.root, {
      silent: 'silent' in options ? options.silent : false
    });

    this.manifest = path.join(this.root, 'package.json');
  }

  /**
   * Create a configuration object with the options supplied to the function
   * and those of our `mono` instance.
   *
   * @param {Object} options Supplied options.
   * @returns {Object} Merged options.
   * @public
   */
  configure(options = {}) {
    return Object.assign({}, this.mono.options, options);
  }

  /**
   * Read the `package.json` of the repo.
   *
   * @returns {Object} The package.json
   * @public
   */
  read() {
    return JSON.parse(fs.readFileSync(this.manifest, 'utf-8'));
  }

  /**
   * Install all the dependencies.
   *
   * @returns {Boolean} Indication of successful installation.
   * @public
   */
  install() {
    try { this.npm.install(); }
    catch (e) { return false; }

    //
    // After installation we want to make sure that our `npm` client knows this
    // library as a candidate for `npm link <name>` so we can symlink all
    // projects together after installation if needed.
    //
    try { this.npm.link(); }
    catch (e) { return false; }

    return true;
  }

  /**
   * Run the tests of the repo.
   *
   * @returns {Boolean} Indication if tests pass or fail.
   * @public
   */
  test() {
    try { this.npm.runScript('test'); }
    catch (e) { return false; }

    return true;
  }

  /**
   * Symlink all known packages/repos.
   *
   * @returns {Boolean} Successful execution.
   * @public
   */
  link() {
    const { dependencies, devDependencies } = this.read();
    const packages = this.mono.packages();
    let success = true;

    //
    // Search the dependencies and devDependencies for package name that match
    // with the names of our hosted mono packages. All matching names will be
    // symlinked.
    //
    [
      ...Object.keys(dependencies),
      ...Object.keys(devDependencies)
    ]
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .filter((name) => !!~packages.indexOf(name))
    .forEach((name) => {
      try { this.npm.link(name); }
      catch (e) { success = false }
    });

    return success;
  }

  /**
   * Cuts a new release.
   *
   * @param {Object} options Optional configuration.
   * @public
   */
  publish(options) {
    options = this.configure(options);

    const pkg = this.read();
    const name = pkg.name;
    const version = options.version || this.bump(pkg.version, options.release);

    //
    // Step 1: Update the package.json to the new version.
    //
    pkg.version = version;
    fs.writeFileSync(this.manifest, JSON.stringify(pkg, null, 2));

    //
    // Step 2: Commit the change
    //
    const message = JSON.stringify(`[dist] Release ${name}@${version} ${options.message}`.trim());
    this.git.commit(`-anm ${message}`);

    //
    // Step 3: Tag the release.
    //
    this.git.tag(`-a "${name}@${version}" -m ${message}`);

    //
    // Step 4: Push the release to the server.
    //
    this.git.push('origin master');
    this.git.push('--tags');

    //
    // Step 5: Publish the bundle to the registery.
    //
    this.npm.publish();

    return true;
  }

  /**
   * Bump the version number to the next release.
   *
   * @param {String} version The version number to bump.
   * @param {String} release Type of release we need to cut.
   * @returns {String} Updated version string.
   * @private
   */
  bump(version, release = '') {
    version = version.split('.');

    switch (release.toLowerCase()) {
      case 'major':
        version[0] = Number(version[0]) + 1;
        version[1] = 0;
        version[2] = 0;
      break;

      case 'minor':
        version[1] = Number(version[1]) + 1;
        version[2] = 0;
      break;

      case 'patch':
      default:
        version[2] = Number(version[2]) + 1;
      break;
    }

    return version.join('.');
  }
}

//
// Export the Repo class
//
module.exports = Repo;
