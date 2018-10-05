const debug = require('diagnostics');
const NPM = require('npm-shizzle');
const rmrf = require('rimraf');
const path = require('path');
const fs = require('fs');

/**
 * Representation of a single repo.
 *
 * @param {Mono} mono Reference to the wrapping mono instance.
 * @param {String} name Name of the repo we represent.
 * @public
 */
class Repo {
  constructor(mono, name) {
    this.mono = mono;
    this.name = name;

    const options = this.configure();

    this.log = debug('mono:repo:'+ this.name);
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
    this.log('installing dependencies');

    try { this.npm.install(); }
    catch (e) {
      this.log('failed to `npm install`', e);
      return false;
    }

    //
    // After installation we want to make sure that our `npm` client knows this
    // library as a candidate for `npm link <name>` so we can symlink all
    // projects together after installation if needed.
    //
    this.log('registering project with `npm link`');
    try { this.npm.link(); }
    catch (e) {
      this.log('failed to `npm link`', e);
      return false;
    }

    return true;
  }

  /**
   * Run the tests of the repo.
   *
   * @returns {Boolean} Indication if tests pass or fail.
   * @public
   */
  test() {
    this.log('running test suite');

    try { this.npm.runScript('test'); }
    catch (e) {
      this.log('failed to `npm test`', e);
      return false;
    }

    return true;
  }

  /**
   * Symlink all known packages/repos.
   *
   * @returns {Boolean} Successful execution.
   * @public
   */
  link() {
    this.log('connecting all mono-repo packages together with symlinks');

    const { dependencies, devDependencies } = this.read();
    const packages = this.mono.packages();
    let success = true;

    //
    // Search the dependencies and devDependencies for package name that match
    // with the names of our hosted mono packages. All matching names will be
    // symlinked.
    //
    [
      ...Object.keys(dependencies || {}),
      ...Object.keys(devDependencies || {})
    ]
    .filter(Boolean)
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .filter((name) => !!~packages.indexOf(name))
    .forEach((name) => {
      this.log(`found package that exists in the mono repo: ${name}`);

      try { this.npm.link(name); }
      catch (e) {
        this.log('failed to `npm link` '+ name, e);
        success = false;
      }
    });

    return success;
  }

  /**
   * Clean up the directory.
   *
   * @returns {Boolean} Successful execution.
   * @public
   */
  uninstall() {
    this.log('unstalling the dependencies');
    let success = true;

    [
      path.join(this.root, 'node_modules')
    ].forEach((dir) => {
      this.log(`rm-rf directory ${dir}`);

      try { rmrf.sync(dir); }
      catch (e) { success = false; }
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
    const git = this.mono.git;
    const version = options.version || this.bump(pkg.version, options.release);

    //
    // Step 1: Update the package.json to the new version.
    //
    pkg.version = version;
    this.log('step (1) updating package.json{version} to %s', version);
    fs.writeFileSync(this.manifest, JSON.stringify(pkg, null, 2));

    //
    // Step 2: Commit the change
    //
    const message = JSON.stringify(`[dist] Release ${name}@${version} ${options.message || ''}`.trim());

    //
    // We want to make sure that we only commit changes of this repo not the
    // other packages so we cannot do a `commit -a` but need to add our folder
    // manually.
    //
    this.log('step (2) adding commit message to git history', message);

    try {
      git.add(this.root);
      git.commit(`-nm ${message}`);
    } catch (e) {
      this.log('step (2) failed to `git commit`', e);
      return false;
    }

    //
    // Step 3: Tag the release.
    //
    const tag = `${name}@${version}`;
    this.log('step (3) generating git', version);

    try { git.tag(`-a "${tag}" -m ${message}`); }
    catch (e) {
      this.log('step (3) failed to add git tag', e);
      return false;
    }

    //
    // Step 4: Push the release to the server.
    //
    this.log('step (4) Pushing tags and commits to master');
    try {
      git.push('origin master');
      git.push('--tags');
    } catch (e) {
      this.log('step (4) failed to push to master', e);
      return false;
    }

    //
    // Step 5: Publish the bundle to the registery.
    //
    this.log('step (5) publishing package');
    try { this.npm.publish(); }
    catch (e) {
      this.log('step (5) failed publish package', e);
      return false;
    }

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
// Export the Repo class.
//
module.exports = Repo;
