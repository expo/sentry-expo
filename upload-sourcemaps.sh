#!/bin/bash

set -eo pipefail

# Copy bundle & sourcemap
mkdir -p ../.tmp/sentry
cp $CONFIGURATION_BUILD_DIR/$UNLOCALIZED_RESOURCES_FOLDER_PATH/main.jsbundle ../.tmp/sentry/main.jsbundle 
cp $DERIVED_FILE_DIR/main.jsbundle.map ../.tmp/sentry/main.jsbundle.map

# Get config values
source ./sentry.properties

# Upload sentry release
# https://docs.sentry.io/cli/releases/#creating-releases
function sentry_release_create {
    npx sentry-cli releases \
        new \
        $SENTRY_RELEASE
}

function sentry_release_upload {
    npx sentry-cli releases \
        files $SENTRY_RELEASE \
        upload-sourcemaps \
        . \
        --ext \
        jsbundle \
        --ext \
        map \
        --rewrite
}

function sentry_set_commits {
    npx sentry-cli releases \
        --set-commits \
        --auto \
        $SENTRY_RELEASE
}

function sentry_set_deploy {
    npx sentry-cli releases \
        deploys \
        $SENTRY_RELEASE \
        new -e \
        $SENTRY_DEPLOY_ENV
}

function sentry_release_finalize {
    npx sentry-cli releases \
        finalize \
        $SENTRY_RELEASE
}

set -x
(cd ../.tmp/sentry; sentry_release_create)
echo "sentry_release create"

(cd ../.tmp/sentry; sentry_release_upload)
echo "sentry_release upload"

if [[ ! -z "$SENTRY_SET_COMMITS" ]] ; then
    (cd ../.tmp/sentry; sentry_set_commits)
fi

if [[ ! -z "$SENTRY_DEPLOY_ENV" ]] ; then
    (cd ../.tmp/sentry; sentry_set_deploy)
fi

(cd ../.tmp/sentry; sentry_release_finalize)
echo "sentry_release finalize"
set +x

echo "Done uploading sourcemaps to Sentry."