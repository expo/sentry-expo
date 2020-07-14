import spawnAsync from '@expo/spawn-async';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import fs from 'fs';
import sentryCliBinary from '@sentry/cli';

type Options = {
  log: (message: string) => void;
  projectRoot: string;
  androidBundle: string;
  androidSourceMap: string;
  iosManifest: { revisionId: string };
  iosSourceMap: string;
  iosBundle: string;
  config?: {
    organization: string;
    project: string;
    authToken: string;
    url: string;
    release?: string;
    deployEnv?: string;
    setCommits?: boolean;
    useGlobalSentryCli: boolean;
  };
};

module.exports = async (options: Options) => {
  let {
    config,
    log,
    iosBundle,
    iosSourceMap,
    iosManifest,
    androidBundle,
    androidSourceMap,
    projectRoot,
  } = options;

  const tmpdir = path.resolve(projectRoot, '.tmp', 'sentry');

  rimraf.sync(tmpdir);
  mkdirp.sync(tmpdir);

  try {
    // We use the same filenames for sourcemaps as Sentry does (even though the naming is unfortunate)
    fs.writeFileSync(tmpdir + '/main.jsbundle', iosBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/main.jsbundle.map', iosSourceMap, 'utf-8');
    fs.writeFileSync(tmpdir + '/index.android.bundle', androidBundle, 'utf-8');
    fs.writeFileSync(tmpdir + '/index.android.bundle.map', androidSourceMap, 'utf-8');

    let organization, project, authToken, url, useGlobalSentryCli, release, setCommits, deployEnv;
    if (!config) {
      log('No config found in app.json, falling back to environment variables...');
    } else {
      ({
        organization,
        project,
        authToken,
        url,
        useGlobalSentryCli,
        release,
        setCommits,
        deployEnv,
      } = config);
    }

    const version = release || process.env.SENTRY_RELEASE || iosManifest.revisionId;

    const childProcessEnv = Object.assign({}, process.env, {
      SENTRY_ORG: organization || process.env.SENTRY_ORG,
      SENTRY_PROJECT: project || process.env.SENTRY_PROJECT,
      SENTRY_AUTH_TOKEN: authToken || process.env.SENTRY_AUTH_TOKEN,
      SENTRY_URL: url || process.env.SENTRY_URL || 'https://sentry.io/',
    });

    const sentryCliBinaryPath = useGlobalSentryCli ? 'sentry-cli' : sentryCliBinary.getPath();

    let output;
    let createReleaseResult = await spawnAsync(sentryCliBinaryPath, ['releases', 'new', version], {
      cwd: tmpdir,
      env: childProcessEnv,
    });

    output = createReleaseResult.stdout.toString();
    log(output);

    let uploadResult = await spawnAsync(
      sentryCliBinaryPath,
      [
        'releases',
        'files',
        version,
        'upload-sourcemaps',
        '.',
        '--ext',
        'jsbundle',
        '--ext',
        'bundle',
        '--ext',
        'map',
        '--rewrite',
        '--strip-prefix',
        projectRoot,
      ],
      {
        cwd: tmpdir,
        env: childProcessEnv,
      }
    );

    output = uploadResult.stdout.toString();
    log(output);

    if (setCommits || process.env.SENTRY_SET_COMMITS) {
      let commitsResult = await spawnAsync(
        sentryCliBinaryPath,
        ['releases', 'set-commits', '--auto', version],
        {
          env: childProcessEnv,
        }
      );

      output = commitsResult.stdout.toString();
      log(output);
    }

    let finalizeReleaseResult = await spawnAsync(
      sentryCliBinaryPath,
      ['releases', 'finalize', version],
      {
        env: childProcessEnv,
      }
    );

    output = finalizeReleaseResult.stdout.toString();
    log(output);

    deployEnv = deployEnv || process.env.SENTRY_DEPLOY_ENV;
    if (deployEnv) {
      let deployResult = await spawnAsync(
        sentryCliBinaryPath,
        ['releases', 'deploys', version, 'new', '-e', deployEnv],
        {
          env: childProcessEnv,
        }
      );

      // filter out unnamed deloy
      output = deployResult.stdout.toString().replace('unnamed ', '');
      log(output);
    }
  } catch (e) {
    log(messageForError(e));
    log(
      `Verify that your Sentry configuration in app.json is correct and refer to https://docs.expo.io/versions/latest/guides/using-sentry.html`
    );
  } finally {
    rimraf.sync(tmpdir);
  }
};

function messageForError(e: Error & { stderr?: string }) {
  let message = e.stderr ? e.stderr.replace(/^\s+|\s+$/g, '') : e.message;
  if (message) {
    if (message.indexOf('error: ') === 0) {
      message = message.replace('error: ', '');
    }
    return `Error uploading sourcemaps to Sentry: ${message}`;
  }

  return 'Error uploading sourcemaps to Sentry';
}
