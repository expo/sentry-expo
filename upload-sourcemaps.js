const spawnAsync = require('@expo/spawn-async');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const fs = require('fs');

module.exports = async options => {
  let {
    config,
    log,
    iosBundle,
    iosSourceMap,
    iosManifest,
    androidBundle,
    androidSourceMap,
    androidManifest,
    projectRoot,
    exp,
  } = options;

  const tmpdir = path.resolve(projectRoot, '.tmp', 'sentry');

  // revisionId is the same between the Android and IOS manifests, so
  // we just pick one and get on with it.
  const version = iosManifest.revisionId;

  rimraf.sync(tmpdir);
  mkdirp.sync(tmpdir);

  try {
    fs.writeFileSync(tmpdir + '/main.ios.bundle', iosBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.android.bundle', androidBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.ios.map', iosSourceMap, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.android.map', iosSourceMap, 'utf-8');

    const childProcessEnv = Object.assign({}, process.env, {
      SENTRY_ORG: config.organization,
      SENTRY_PROJECT: config.project,
      SENTRY_AUTH_TOKEN: config.authToken,
    });

    let output;
    let createReleaseResult = await spawnAsync(
      'sentry-cli',
      ['releases', 'new', version],
      {
        cwd: tmpdir,
        env: childProcessEnv,
      }
    );

    output = createReleaseResult.stdout.toString();
    log(output);

    let uploadResult = await spawnAsync(
      'sentry-cli',
      [
        'releases',
        'files',
        version,
        'upload-sourcemaps',
        '.',
        '--ext',
        'bundle',
        '--ext',
        'map',
        '--rewrite',
      ],
      {
        cwd: tmpdir,
        env: childProcessEnv,
      }
    );

    output = uploadResult.stdout.toString();
    log(output);
  } catch (e) {
    log(e.stack);
  } finally {
    rimraf.sync(tmpdir);
  }
};
