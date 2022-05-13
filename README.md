## RADAR-Questionnaire

![Travis CI](https://travis-ci.org/RADAR-base/RADAR-Questionnaire.svg?branch=master)
[![BCH compliance](https://bettercodehub.com/edge/badge/RADAR-base/RADAR-Questionnaire?branch=master)](https://bettercodehub.com/)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/03ec17f46bf147278bc71242a769af88)](https://www.codacy.com/app/yatharthranjan89/RADAR-Questionnaire?utm_source=github.com&utm_medium=referral&utm_content=RADAR-base/RADAR-Questionnaire&utm_campaign=Badge_Grade)

A hybrid mobile application to actively capture data for the RADAR-Base Platform.

## Note

We use the [Ionic framework](http://ionicframework.com/docs/), which is built with [Angular](https://angular.io/) and wraps [Apache Cordova](https://cordova.apache.org/).

### Recommended Package Versions

It is recommended that you install the following versions or later:

```
node v13.8.0
ionic v5.4.16
npm v6.13.6
yarn v1.19.0
```

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

Cordova provides a simple command to install the plugins and platforms set in `package.json` or `config.xml`.

```
$ cordova prepare
```

To run the application in the browser use:

```
$ ionic serve
```

## Guidelines

Use the following command to sort, format and fix common css problems:

```
$ yarn fix:css
```

Use the following command before commiting to fix all common styling and sorting problems:

```
$ yarn fix:all
```

## Platforms

In order to add platforms to target, you must install the required SDKs.

### Android

To add the Android platform, you need to have the [Android SDK](https://developer.android.com/studio/index.html) pre installed. This step also adds the plugins listed in `config.xml` to the project.

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

### iOS

To add the iOS platform, you need to have [XCode](https://apps.apple.com/us/app/xcode/id497799835?mt=12) pre installed.

```
$ ionic cordova platform add ios
```

Run the app in an iOS device:

```
$ ionic cordova run ios
```

## Firebase

If using Firebase for notifications, analytics, or remote config, [create your Firebase project](https://console.firebase.google.com/). Then, add your iOS or Android app to the Firebase project. Once added, please download the app's `google-services.json` file (for Android) and `GoogleService-Info.plist` (for iOS), and add it to the root directory.

### Package Name

When you add your iOS or Android app to the Firebase project, make sure you name your `package name` as app-id

- Android : `org.phidatalab.radar_armt`
- iOS: `org.phidatalab.radar-armt`

### Remote Notifications

If using FCM pull notifications instead of the local ones, please specify the FCM sender id (as mentioned in FCM settings) in `src/assets/data/defaultConfig.ts` and the default notification type to FCM (this is already the default value).

```ts
export const FCMPluginProjectSenderId = 'your-sender-id'
export const DefaultNotificationType = 'FCM'
```

In order for notifications to be sent, you must run your own app server. It is part of the [RADAR-base stack](https://github.com/RADAR-base/RADAR-Docker/), and specific docs can be found [here](https://github.com/RADAR-base/RADAR-Docker/tree/dev/dcompose-stack/firebase-app-server).

#### iOS Remote Push Notifications

For Android remote notifications, setting your sender ID and adding your `google-services.json` file is enough to begin receiving notifications. However, for iOS notifications, you must add either an APNs authentication key or APNs certificate to connect with Apple Push Notifications. This can be added in the Firebase project's Cloud Messaging settings.

### Remote Config

Certain values can be overriden using Firebase Remote Config. Specifically, the following variables are supported:

| Parameter                       | Description                                                                                                                                                                                               | Default value                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `oauth_client_id`               | Client ID to connect to the ManagementPortal with                                                                                                                                                         | `aRMT`                                                                                                           |
| `oauth_client_secret`           | Client secret to connect to the ManagementPortal with                                                                                                                                                     | ``                                                                                                               |
| `oauth_refresh_seconds`         | After how many seconds to refresh the OAuth token                                                                                                                                                         | `1800` (=30 minutes)                                                                                             |
| `protocol_repo`                 | Github repo where the protocol definitions are located.                                                                                                                                                   | `RADAR-Base/RADAR-aRMT-protocols`                                                                                |
| `protocol_branch`               | Github branch where the protocol definitions should be read from                                                                                                                                          | `master`                                                                                                         |
| `protocol_path`                 | Path inside a project name that should be read for a protocol                                                                                                                                             | `protocol.json`                                                                                                  |
| `kafka_specification_url`       | URL of the Kafka topic specification                                                                                                                                                                      | <https://api.github.com/repos/RADAR-base/radar-schemas/contents/specifications/active/aRMT-1.4.3.yml?ref=master> |
| `platform_instance`             | Title of RADAR Base / platform instance                                                                                                                                                                   | `RADAR-CNS`                                                                                                      |
| `participant_attribute_order`   | Map that specifies the order in which the attributes are matched with the protocol path                                                                                                                   | `{Human-readable-identifier: -1}`                                                                                |
| `schedule_year_coverage`        | Schedule coverage in years (length of schedule to generate tasks until)                                                                                                                                   | `3`                                                                                                              |
| `notification_messaging_type`   | Notifications type (either 'FCM_XMPP', 'FCM_REST' or 'LOCAL' notifications)                                                                                                                               | `FCM_XMPP`                                                                                                       |
| `app_server_url`                | Default app server url.                                                                                                                                                                                   | `{DefaultEndPoint + '/appserver'}`                                                                               |
| `github_fetch_strategy`         | Default Github fetch strategy for Github requests (default or appserver).                                                                                                                                 | `default`                                                                                                        |
| `app_credits_title`             | Title of the popup box that appears when you tap on the app logo on the left hand side of the homepage.                                                                                                   | `Credits`                                                                                                        |
| `app_credits_body`              | Body of the popup box that appears when you tap on the app logo on the left hand side of the homepage.                                                                                                    | `Made with &hearts; for you by the RADAR-Base community.`                                                        |
| `auto_next_questionnaire_types` | String list of question/question input types where the questionnaire will automatically move to the next question upon answering the question. It is recommended to always include timed and audio types. | `timed,audio`                                                                                                    |
| `skippable_questionnaire_types` | String list of question/question input types where the next button is enabled by default, allowing the question to be skippable.                                                                          | `audio`                                                                                                          |

#### Conditions

Conditions can be added to remote config variables to target specific groups of users. Different condition rule types are supported: app, platform, country/region, user property, date/time, and random percentile. For example a `protocol_branch` config value can be different based on the user property `projectId`.

#### Protocol Attributes

A user/subject can have `attributes` which are taken from Management Portal. These could determine what protocol would be pulled for the user from Github ([RADAR aRMT Protocols](https://github.com/RADAR-base/RADAR-aRMT-protocols)). The repository should follow the format: `/PROJECT_NAME/ATTRIBUTE-KEY/ATTRIBUTE-VALUE/protocol.json`. Please note that a default `protocol.json` file must always be present in the project directory, e.g.: `/PROJECT_NAME/protocol.json`.

If multiple attributes are present for the user, the `participant_attribute_order` from the Remote Config will be used to determine which attribute takes precedence. If this is not present, the default value is `{Human-readable-identifier: -1}`; the human readable id will always be the highest priority. If an order value is not present for the attribute, the default value (`MAX_INT_VALUE`) would be used.

### Analytics

In order to personalize Firebase events and remote config variables, certain user properties may be added to the Firebase console. Specifically, the following user properties are supported:

| Property          | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `subjectId`       | Custom identifier for the user                                    |
| `humanReadableId` | Human readable identifier for the user                            |
| `baseUrl`         | Custom identifier for the base URL of the project                 |
| `projectId`       | Custom identifier for the project that a user belongs to          |
| `sourceId`        | Custom identifier for the source the application is registered as |
| `enrolmentDate`   | Enrolment date of the user                                        |

Further details on the events that are already logged, default events, and default user properties can be found on the [RADAR Base wiki pages](https://radar-base.atlassian.net/wiki/spaces/RAD/pages/905707521/Firebase+Analytics).

## Other Config Options

You can change the default config locally in `src/assets/data/defaultConfig.ts`. Some of these can also be modified in Firebase remote config.

The main configs you may want to modify are:

The client secret for OAuth authorisation with the Management Portal (empty by default).

```ts
export const DefaultOAuthClientSecret = ''
```

The default endpoint of where the RADAR-base platform is hosted.

```ts
export const DefaultEndPoint = 'https://your-hosted-radar-platform-base-url/'
```

The default appserver configs.

```ts
// The notification type (either 'FCM_XMPP', 'FCM_REST' or 'LOCAL' notifications)
export const DefaultNotificationType: string = 'FCM_XMPP'

// App server URL
export const DefaultAppServerURL = DefaultEndPoint + '/appserver'
```

You can also change the default Github source details where the questionnaire scheduling protocols and questionnaire schemas are hosted.

```ts
// The Github repository where the protocols are located
export const DefaultProtocolGithubRepo = 'RADAR-Base/RADAR-aRMT-protocols'

// The name of the branch in the protocol repository
export const DefaultProtocolBranch = 'master'

// The name of the repository where the questionnaire schemas are located
export const DefaultSchemaGithubRepo = 'RADAR-Base/RADAR-Schemas'

// The name of the branch in the schema repository
export const DefaultSchemaBranch = 'master'

// The Github content fetching mechanism, if this is done by a direct request to Github or a request through the app server. (REMOTE CONFIG KEY: `github_fetch_strategy`, VALUES: `default` (direct to Github) or `appserver`)
export const DefaultGithubFetchStrategy = 'default'
```

## Adding Language Support

Translations must be specified or modified in the localisations file `(src/assets/data/localisations.ts)`. When adding additional text in the localisations file, additional keys must also be added to `src/app/shared/enums/localisations.ts`.

To add additional languages, the following default config `(src/assets/data/defaultConfig.ts)` variable must be updated:

```ts
export const DefaultSettingsSupportedLanguages: LanguageSetting[] = []
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

## Questionnaire Input Types

The questionnaire input types supported are `audio`, `checkbox`, `descriptive`, `info-screen`, `matrix-radio`, `radio`, `range-info`, `range-input`, `slider`, `text`, `date`, `time`, and `timed-test`.

### Descriptive Input Type

The descriptive input supports HTML in the `field_label` property of a questionnaire in the questionnaire definition. The css will automatically be inherited from the app. Here is an example input:

```
Hello this is an example of a descriptive input text.
<br> <br>
<b>This is a bold text</b>
<br>
<h1>This is an h1</h1>
<br>
<h2>This is an h2</h2>
<br>
<h3>This is an h3</h3> <h4>This is an h4</h4> <h5>This is an h5</h5>
<br>
<iframe width="560" height="315" src="https://www.youtube.com/embed/4rxh60G2RRU" title="YouTube video player" allowfullscreen></iframe>
<br><br>
This is an example of an image:
<br>
<img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg">
```

Here is the output:

<img src="/.github/etc/descriptive-2.png" width="200px"><img src="/.github/etc/descriptive-1.png" width="200px">

## Common Error

Here are some common errors you might find during installation.

### Error: cordova-custom-config

When you are running `ionic cordova run ios`, you might encounter the problem, we solved this problem by refering this [issue](https://github.com/dpa99c/cordova-custom-config/issues/144) with `cordova-custom-config`.

We enter the following command at the root directory.
```
cd plugins/cordova-custom-config
yarn install 
```
