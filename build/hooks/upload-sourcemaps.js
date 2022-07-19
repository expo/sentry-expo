"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const spawn_async_1 = __importDefault(require("@expo/spawn-async"));
const path_1 = __importDefault(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const fs_1 = __importDefault(require("fs"));
const cli_1 = __importDefault(require("@sentry/cli"));
module.exports = async (options) => {
    let { config, log, iosBundle, iosSourceMap, iosManifest, androidBundle, androidSourceMap, projectRoot, } = options;
    const tmpdir = path_1.default.resolve(projectRoot, '.tmp', 'sentry');
    rimraf_1.default.sync(tmpdir);
    mkdirp_1.default.sync(tmpdir);
    try {
        // We use the same filenames for sourcemaps as Sentry does (even though the naming is unfortunate)
        fs_1.default.writeFileSync(tmpdir + '/main.jsbundle', iosBundle, 'utf-8');
        fs_1.default.writeFileSync(tmpdir + '/main.jsbundle.map', iosSourceMap, 'utf-8');
        fs_1.default.writeFileSync(tmpdir + '/index.android.bundle', androidBundle, 'utf-8');
        fs_1.default.writeFileSync(tmpdir + '/index.android.bundle.map', androidSourceMap, 'utf-8');
        if (!config) {
            log('No config found in app.json, falling back to environment variables...');
        }
        const childProcessEnv = Object.assign({}, process.env, {
            SENTRY_ORG: (config && config.organization) || process.env.SENTRY_ORG,
            SENTRY_PROJECT: (config && config.project) || process.env.SENTRY_PROJECT,
            SENTRY_AUTH_TOKEN: (config && config.authToken) || process.env.SENTRY_AUTH_TOKEN,
            SENTRY_URL: (config && config.url) || process.env.SENTRY_URL || 'https://sentry.io/',
        });
        const uploadOptions = getUploadOptions(config, process.env, iosManifest);
        await createAndUploadRelease(uploadOptions, childProcessEnv, projectRoot, tmpdir, log);
    }
    catch (e) {
        log(messageForError(e));
        log(`Verify that your Sentry configuration in app.json is correct and refer to https://docs.expo.io/versions/latest/guides/using-sentry.html`);
    }
    finally {
        rimraf_1.default.sync(tmpdir);
    }
};
function getUploadOptions(config, env, manifest) {
    const { release, deployEnv, setCommits, useGlobalSentryCli, distribution } = config || {};
    return {
        release: release || env.SENTRY_RELEASE || manifest.revisionId,
        deployEnv: deployEnv || env.SENTRY_DEPLOY_ENV || null,
        setCommits: setCommits || env.SENTRY_SET_COMMITS || false,
        useGlobalSentryCli: !!useGlobalSentryCli,
        distribution: distribution || env.SENTRY_DIST || manifest.version,
    };
}
function extensionsForPlatform(platform = '') {
    if (platform === 'android') {
        return ['--ext', 'bundle', '--ext', 'map', '--ignore', 'main.jsbundle.map'];
    }
    else if (platform === 'ios') {
        return ['--ext', 'jsbundle', '--ext', 'map', '--ignore', 'index.android.bundle.map'];
    }
    else {
        // Otherwise let's just pass in all the sourcemap files
        return ['--ext', 'jsbundle', '--ext', 'bundle', '--ext', 'map'];
    }
}
async function createAndUploadRelease(userOptions, childProcessEnv, projectRoot, tmpdir, log) {
    const { useGlobalSentryCli, release, distribution, setCommits, deployEnv, platform, } = userOptions;
    const sentryCliBinaryPath = useGlobalSentryCli ? 'sentry-cli' : cli_1.default.getPath();
    let output;
    let createReleaseResult = await (0, spawn_async_1.default)(sentryCliBinaryPath, ['releases', 'new', release], {
        cwd: tmpdir,
        env: childProcessEnv,
    });
    output = createReleaseResult.stdout.toString();
    log(output);
    let uploadResult = await (0, spawn_async_1.default)(sentryCliBinaryPath, [
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
    ], {
        cwd: tmpdir,
        env: childProcessEnv,
    });
    output = uploadResult.stdout.toString();
    log(output);
    if (setCommits) {
        let commitsResult = await (0, spawn_async_1.default)(sentryCliBinaryPath, ['releases', 'set-commits', '--auto', release], {
            env: childProcessEnv,
        });
        output = commitsResult.stdout.toString();
        log(output);
    }
    let finalizeReleaseResult = await (0, spawn_async_1.default)(sentryCliBinaryPath, ['releases', 'finalize', release], {
        env: childProcessEnv,
    });
    output = finalizeReleaseResult.stdout.toString();
    log(output);
    if (deployEnv) {
        let deployResult = await (0, spawn_async_1.default)(sentryCliBinaryPath, ['releases', 'deploys', release, 'new', '-e', deployEnv], {
            env: childProcessEnv,
        });
        // filter out unnamed deloy
        output = deployResult.stdout.toString().replace('unnamed ', '');
        log(output);
    }
}
function messageForError(e) {
    let message = e.stderr ? e.stderr.replace(/^\s+|\s+$/g, '') : e.message;
    if (message) {
        if (message.indexOf('error: ') === 0) {
            message = message.replace('error: ', '');
        }
        return `Error uploading sourcemaps to Sentry: ${message}`;
    }
    return 'Error uploading sourcemaps to Sentry';
}
//# sourceMappingURL=upload-sourcemaps.js.map