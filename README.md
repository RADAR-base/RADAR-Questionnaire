## RADAR-Questionnaire

![Travis CI](https://travis-ci.org/RADAR-base/RADAR-Questionnaire.svg?branch=master)
[![BCH compliance](https://bettercodehub.com/edge/badge/RADAR-base/RADAR-Questionnaire?branch=master)](https://bettercodehub.com/)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/03ec17f46bf147278bc71242a769af88)](https://www.codacy.com/app/yatharthranjan89/RADAR-Questionnaire?utm_source=github.com&utm_medium=referral&utm_content=RADAR-base/RADAR-Questionnaire&utm_campaign=Badge_Grade)

Hybrid mobile application to actively capture data for the RADAR-Base Platform.

## Note

We use the [Ionic framework](http://ionicframework.com/docs/), which is built with [Angular](https://angular.io/) and wraps [Apache Cordova](https://cordova.apache.org/).

## Install

First install [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/en/docs/install).

Globally install ionic and cordova:

```
$ yarn global add ionic cordova
```

In the project folder run `yarn` to install dependencies:

```
$ yarn
```
Create a directory named `www` under the root folder
```
$ mkdir www
```

Cordova provides a simple command to install the plugins and platforms set in `package.json` or `config.xml`.

```
$ cordova prepare
```

To run the application in the browser use:

```
$ ionic serve
```

## Fix CSS

Use the following command to sort, format and fix common css problems:

```
$ yarn fix:css
```

### Android

To add the Android platform. You need to have the [Android SDK](https://developer.android.com/studio/index.html) pre installed. This step also adds the plugins listed in `config.xml` to the project.

```
$ ionic cordova platform add android
```

Run the app in an Android device:

```
$ ionic cordova run android
```

Run the app in an Android emulator:

```
$ ionic cordova emulate android
```

## Firebase remote config

Certain values can be overriden using Firebase Remote Config. Specifically, the following variables are supported:

| Parameter                 | Description                                                      | Default value                                                                                                    |
| ------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `oauth_client_id`         | Client ID to connect to the ManagementPortal with                | `aRMT`                                                                                                           |
| `oauth_client_secret`     | Client secret to connect to the ManagementPortal with            | Value set in `secret.ts`                                                                                         |
| `oauth_refresh_seconds`   | After how many seconds to refresh the OAuth token                | `1800` (=30 minutes)                                                                                             |
| `protocol_base_url`       | Base URL where the protocol definitions are located.             | <https://api.github.com/repos/RADAR-base/RADAR-aRMT-protocols/contents>                                          |
| `protocol_branch`         | Github branch where the protocol definitions should be read from | `master`                                                                                                         |
| `protocol_path`           | Path inside a project name that should be read for a protocol    | `protocol.json`                                                                                                  |
| `kafka_specification_url` | URL of the Kafka topic specification                             | <https://api.github.com/repos/RADAR-base/radar-schemas/contents/specifications/active/aRMT_1.4.3.yml?ref=master> |
| `platform_instance`       | Title of RADAR Base / platform instance                          | `RADAR-CNS`                                                                                                      |

## Other Config Options

Copy `src/assets/data/secret.ts.template` to `src/assets/data/secret.ts` and add the following configuration -

```ts
// The client secret for OAuth authorisation with the Management Portal
export const DefaultSourceProducerAndSecretExport: string = 'aRMT:<aRMT-secret>'
```

In `src/assets/data/defaultConfig.ts` the following settings can be changed:

If using FCM pull notifications instead of the local ones, please specify the FCM sender id (as mentioned in FCM settings) in `src/assets/data/defaultConfig.ts`. Don't forget to add the app's `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) file to the root of your project.

```ts
export const FCMPluginProjectSenderId: string = 'your-sender-id'
```

The Default endpoint of where the RADAR-base platform is hosted.

```ts
export const DefaultEndPoint: string =
  'https://your-hosted-radar-platform-base-url/'
```

Also change the Default Github source details where the questionnaire scheduling protocols and questionnaire schemas are hosted.

```ts
// The Github repository where the protocols are located
export const DefaultProtocolGithubRepo = 'RADAR-Base/RADAR-aRMT-protocols'

// The name of the branch in the protocol repository
export const DefaultProtocolBranch = 'master'

// The name of the repository where the questionnaire schemas are located
export const DefaultSchemaGithubRepo = 'RADAR-Base/RADAR-Schemas'

// The name of the branch in the schema repository
export const DefaultSchemaBranch = 'master'
```

## Publishing to the Google Playstore

Instructions to build a signed apk for publishing on the playstore -

1. Clone the aRMT project from github.
2. Configure it as per instructions above.
3. Run the following to build the app

```shell
yarn install
yarn build
ionic cordova platform add android
yarn install
ionic cordova build --release android
```

4. This will generate an apk at `<your-project-path>/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk`
5. Create a keystore for signing the apk. Keep this safe as this is tied to your play releases and only apks signed by this can be released to the playstore after the intitial release.
6. You will need to then sign this apk using jarsigner

```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -storepass <your-keystore-pass> -keystore <your-keystore-path> <your-project-path>/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk alias_name;
```

7. Then you will need to align the apk using zipalign (https://developer.android.com/studio/command-line/zipalign) like-

```
$ANDROID_HOME/build-tools/27.0.2/zipalign -v 4 <your-project-path>/platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk <your-project-path>/platforms/android/app/build/outputs/apk/release/radar-armt-app-$APP_VERSION.apk;
```

8. Now the apk is ready to be uploaded to the playstore at path `<your-project-path>/platforms/android/app/build/outputs/apk/release/radar-armt-app-$APP_VERSION.apk`
9. NOTE: The signing and aligning can also be done by importing the android project at path `<your-project-path>/platforms/android/` into Android Studio.
