import spawnAsync from '@expo/spawn-async';
import path from 'path';
import rimraf from 'rimraf';
import mkdirp from 'mkdirp';
import fs from 'fs';
import sentryCliBinary from '@sentry/cli';

type ExpoSentryConfig = {
  organization: string;
  project: string;
  authToken: string;
  url: string;
} & SentryUploadOptions;

type SentryUploadOptions = {
  release: string;
  deployEnv: string | null;
  setCommits: boolean | string;
  useGlobalSentryCli: boolean;
  distribution: string;
  platform?: string | undefined;
};

type Options = {
  log: (message: string) => void;
  projectRoot: string;
  androidManifest: Manifest;
  androidBundle: string;
  androidSourceMap: string;
  iosManifest: Manifest;
  iosSourceMap: string;
  iosBundle: string;
  config?: ExpoSentryConfig;
};

type Manifest = { revisionId: string; version: string };

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

    if (!config) {
      log('No config found in app.json, falling back to environment variables...');
    }

    const childProcessEnv = Object.assign({}, process.env, {
      SENTRY_ORG: config?.organization || process.env.SENTRY_ORG,
      SENTRY_PROJECT: config?.project || process.env.SENTRY_PROJECT,
      SENTRY_AUTH_TOKEN: config?.authToken || process.env.SENTRY_AUTH_TOKEN,
      SENTRY_URL: config?.url || process.env.SENTRY_URL || 'https://sentry.io/',
    });

    const uploadOptions = getUploadOptions(config, process.env, iosManifest);
    await createAndUploadRelease(uploadOptions, childProcessEnv, projectRoot, tmpdir, log);
  } catch (e) {
    log(messageForError(e));
    log(
      `Verify that your Sentry configuration in app.json is correct and refer to https://docs.expo.io/versions/latest/guides/using-sentry.html`
    );
  } finally {
    rimraf.sync(tmpdir);
  }
};

function getUploadOptions(
  config: ExpoSentryConfig | undefined,
  env: NodeJS.ProcessEnv,
  manifest: Manifest
): SentryUploadOptions {
  return {
    release: config?.release || env.SENTRY_RELEASE || manifest.revisionId,
    deployEnv: config?.deployEnv || env.SENTRY_DEPLOY_ENV || null,
    setCommits: config?.setCommits || env.SENTRY_SET_COMMITS || false,
    useGlobalSentryCli: config?.useGlobalSentryCli ?? false,
    distribution: config?.distribution || env.SENTRY_DIST || manifest.version,
  };
}

function extensionsForPlatform(platform: string = ''): string[] {
  if (platform === 'android') {
    return ['--ext', 'bundle', '--ext', 'map', '--ignore', 'main.jsbundle.map'];
  } else if (platform === 'ios') {
    return ['--ext', 'jsbundle', '--ext', 'map', '--ignore', 'index.android.bundle.map'];
  } else {
    // Otherwise let's just pass in all the sourcemap files
    return ['--ext', 'jsbundle', '--ext', 'bundle', '--ext', 'map'];
  }
}

async function createAndUploadRelease(
  userOptions: SentryUploadOptions,
  childProcessEnv: NodeJS.ProcessEnv,
  projectRoot: string,
  tmpdir: string,
  log: (message: string) => void
) {
  const {
    useGlobalSentryCli,
    release,
    distribution,
    setCommits,
    deployEnv,
    platform,
  } = userOptions;
  const sentryCliBinaryPath = useGlobalSentryCli ? 'sentry-cli' : sentryCliBinary.getPath();

  let output;
  let createReleaseResult = await spawnAsync(sentryCliBinaryPath, ['releases', 'new', release], {
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
      release,
      'upload-sourcemaps',
      '.',
      ...extensionsForPlatform(platform),
      '--rewrite',
      '--dist',
      distribution,
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

  if (setCommits) {
    let commitsResult = await spawnAsync(
      sentryCliBinaryPath,
      ['releases', 'set-commits', '--auto', release],
      {
        env: childProcessEnv,
      }
    );

    output = commitsResult.stdout.toString();
    log(output);
  }

  let finalizeReleaseResult = await spawnAsync(
    sentryCliBinaryPath,
    ['releases', 'finalize', release],
    {
      env: childProcessEnv,
    }
  );

  output = finalizeReleaseResult.stdout.toString();
  log(output);

  if (deployEnv) {
    let deployResult = await spawnAsync(
      sentryCliBinaryPath,
      ['releases', 'deploys', release, 'new', '-e', deployEnv],
      {
        env: childProcessEnv,
      }
    );

    // filter out unnamed deloy
    output = deployResult.stdout.toString().replace('unnamed ', '');
    log(output);
  }
}

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
