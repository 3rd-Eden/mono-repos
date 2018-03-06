const { describe, it } = require('mocha');
const assume = require('assume');
const Repo = require('../repo');
const path = require('path');
const Mono = require('../');

describe('Repo', function () {
  const fixture = path.join(__dirname, 'fixture');
  const mono = new Mono(fixture);
  let pkg;

  beforeEach(function () {
    pkg = new Repo(mono, 'foo');
  });

  describe('.name', function () {
    it('is the name of the package', function () {
      assume(pkg.name).equals('foo');
    });
  });

  describe('#configure', function () {
    it('merges with options of mono', function () {
      const m = new Mono(fixture, { foo: 'bar', bar: 'baz' });
      pkg = new Repo(m, 'foo');

      const r = pkg.configure({ foo: 'hello', hello: 'world' });
      assume(r).deep.equals({
        foo: 'hello',
        hello: 'world',
        bar: 'baz'
      });
    });
  });

  describe('#read', function () {
    it('returns the package.json', function () {
      const data = pkg.read();

      assume(data).is.a('object');
      assume(data.name).equals('mono-repos-fixture-foo');
    });
  });

  describe('#bump', function () {
    it('bumps the supplied version numbers patch by default', function () {
      assume(pkg.bump('0.0.0')).to.equal('0.0.1');
      assume(pkg.bump('1.2.3')).to.equal('1.2.4');
    });

    it('bumps the patch number', function () {
      assume(pkg.bump('0.0.0', 'patch')).to.equal('0.0.1');
      assume(pkg.bump('1.2.3', 'patch')).to.equal('1.2.4');
    });

    it('resets the patch on minor bump', function () {
      assume(pkg.bump('0.0.12', 'minor')).to.equal('0.1.0');
      assume(pkg.bump('7.6.0', 'minor')).to.equal('7.7.0');
    });

    it('resets minor and patch on major', function () {
      assume(pkg.bump('0.1.12', 'major')).to.equal('1.0.0');
      assume(pkg.bump('7.6.1', 'major')).to.equal('8.0.0');
    });
  });
});
