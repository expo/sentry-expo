declare type Options = {
    log: (message: string) => void;
    projectRoot: string;
    androidBundle: string;
    androidSourceMap: string;
    iosManifest: {
        revisionId: string;
    };
    iosSourceMap: string;
    iosBundle: string;
    config?: {
        organization: string;
        project: string;
        authToken: string;
        url: string;
        useGlobalSentryCli: boolean;
    };
};
declare const _default: (options: Options) => Promise<void>;
export default _default;
