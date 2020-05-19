"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var spawn_async_1 = __importDefault(require("@expo/spawn-async"));
var path_1 = __importDefault(require("path"));
var rimraf_1 = __importDefault(require("rimraf"));
var mkdirp_1 = __importDefault(require("mkdirp"));
var fs_1 = __importDefault(require("fs"));
var cli_1 = __importDefault(require("@sentry/cli"));
exports.default = (function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var config, log, iosBundle, iosSourceMap, iosManifest, androidBundle, androidSourceMap, projectRoot, tmpdir, version, organization, project, authToken, url, useGlobalSentryCli, childProcessEnv, sentryCliBinaryPath, output, createReleaseResult, uploadResult, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                config = options.config, log = options.log, iosBundle = options.iosBundle, iosSourceMap = options.iosSourceMap, iosManifest = options.iosManifest, androidBundle = options.androidBundle, androidSourceMap = options.androidSourceMap, projectRoot = options.projectRoot;
                tmpdir = path_1.default.resolve(projectRoot, '.tmp', 'sentry');
                version = iosManifest.revisionId;
                rimraf_1.default.sync(tmpdir);
                mkdirp_1.default.sync(tmpdir);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, 5, 6]);
                fs_1.default.writeFileSync(tmpdir + '/main.ios.bundle', iosBundle, 'utf-8');
                fs_1.default.writeFileSync(tmpdir + '/main.android.bundle', androidBundle, 'utf-8');
                fs_1.default.writeFileSync(tmpdir + '/main.ios.map', iosSourceMap, 'utf-8');
                fs_1.default.writeFileSync(tmpdir + '/main.android.map', androidSourceMap, 'utf-8');
                organization = void 0, project = void 0, authToken = void 0, url = void 0, useGlobalSentryCli = void 0;
                if (!config) {
                    log('No config found in app.json, falling back to environment variables...');
                }
                else {
                    (organization = config.organization, project = config.project, authToken = config.authToken, url = config.url, useGlobalSentryCli = config.useGlobalSentryCli);
                }
                childProcessEnv = Object.assign({}, process.env, {
                    SENTRY_ORG: organization || process.env.SENTRY_ORG,
                    SENTRY_PROJECT: project || process.env.SENTRY_PROJECT,
                    SENTRY_AUTH_TOKEN: authToken || process.env.SENTRY_AUTH_TOKEN,
                    SENTRY_URL: url || process.env.SENTRY_URL || 'https://sentry.io/',
                });
                sentryCliBinaryPath = useGlobalSentryCli ? 'sentry-cli' : cli_1.default.getPath();
                output = void 0;
                return [4 /*yield*/, spawn_async_1.default(sentryCliBinaryPath, ['releases', 'new', version], {
                        cwd: tmpdir,
                        env: childProcessEnv,
                    })];
            case 2:
                createReleaseResult = _a.sent();
                output = createReleaseResult.stdout.toString();
                log(output);
                return [4 /*yield*/, spawn_async_1.default(sentryCliBinaryPath, [
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
                    ], {
                        cwd: tmpdir,
                        env: childProcessEnv,
                    })];
            case 3:
                uploadResult = _a.sent();
                output = uploadResult.stdout.toString();
                log(output);
                return [3 /*break*/, 6];
            case 4:
                e_1 = _a.sent();
                log(messageForError(e_1));
                log("Verify that your Sentry configuration in app.json is correct and refer to https://docs.expo.io/versions/latest/guides/using-sentry.html");
                return [3 /*break*/, 6];
            case 5:
                rimraf_1.default.sync(tmpdir);
                return [7 /*endfinally*/];
            case 6: return [2 /*return*/];
        }
    });
}); });
function messageForError(e) {
    var message = e.stderr ? e.stderr.replace(/^\s+|\s+$/g, '') : e.message;
    if (message) {
        if (message.indexOf('error: ') === 0) {
            message = message.replace('error: ', '');
        }
        return "Error uploading sourcemaps to Sentry: " + message;
    }
    return 'Error uploading sourcemaps to Sentry';
}
