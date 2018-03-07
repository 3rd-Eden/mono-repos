const { describe, it } = require('mocha');
const assume = require('assume');
const Repo = require('../repo');
const path = require('path');
const Mono = require('../');

describe('Repo', function () {
  const fixture = path.join(__dirname, 'fixture');
  const mono = new Mono(fixture);
  let repo;

  beforeEach(function () {
    repo = new Repo(mono, 'foo');
  });

  describe('.name', function () {
    it('is the name of the package', function () {
      assume(repo.name).equals('foo');
    });
  });

  describe('#configure', function () {
    it('merges with options of mono', function () {
      const m = new Mono(fixture, { foo: 'bar', bar: 'baz' });
      repo = new Repo(m, 'foo');

      const r = repo.configure({ foo: 'hello', hello: 'world' });
      assume(r).deep.equals({
        foo: 'hello',
        hello: 'world',
        bar: 'baz'
      });
    });
  });

  describe('#read', function () {
    it('returns the package.json', function () {
      const data = repo.read();

      assume(data).is.a('object');
      assume(data.name).equals('mono-repos-fixture-foo');
    });
  });

  describe.only('#publish', function () {
    it('releases a new version', function () {
      assume(repo.publish()).is.true();
    });
  });

  describe('#bump', function () {
    it('bumps the supplied version numbers patch by default', function () {
      assume(repo.bump('0.0.0')).to.equal('0.0.1');
      assume(repo.bump('1.2.3')).to.equal('1.2.4');
    });

    it('bumps the patch number', function () {
      assume(repo.bump('0.0.0', 'patch')).to.equal('0.0.1');
      assume(repo.bump('1.2.3', 'patch')).to.equal('1.2.4');
    });

    it('resets the patch on minor bump', function () {
      assume(repo.bump('0.0.12', 'minor')).to.equal('0.1.0');
      assume(repo.bump('7.6.0', 'minor')).to.equal('7.7.0');
    });

    it('resets minor and patch on major', function () {
      assume(repo.bump('0.1.12', 'major')).to.equal('1.0.0');
      assume(repo.bump('7.6.1', 'major')).to.equal('8.0.0');
    });
  });
});
