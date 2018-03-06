const { describe, it } = require('mocha');
const assume = require('assume');
const Repo = require('../repo');
const path = require('path');
const Mono = require('../');

describe('Mono', function () {
  const fixture = path.join(__dirname, 'fixture');
  const mono = new Mono(fixture);

  describe('#repo', function () {
    it('returns a repo instance for a given package name', function () {
      const repo = mono.repo('foo');

      assume(repo).is.instanceOf(Repo);
    });
  });

  describe('#resolve', function () {
    it('returns the path to the folder', function () {
      const foo = mono.resolve('foo');

      assume(foo).equals(path.join(fixture, 'packages', 'foo'));
    });
  });
});
