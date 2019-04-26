## RADAR-Questionnaire

![Travis CI](https://travis-ci.org/RADAR-base/RADAR-Questionnaire.svg?branch=master)
[![BCH compliance](https://bettercodehub.com/edge/badge/RADAR-base/RADAR-Questionnaire?branch=master)](https://bettercodehub.com/)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/03ec17f46bf147278bc71242a769af88)](https://www.codacy.com/app/yatharthranjan89/RADAR-Questionnaire?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=RADAR-base/RADAR-Questionnaire&amp;utm_campaign=Badge_Grade)

Hybrid mobile application to actively capture data for the RADAR-CNS Platform.

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

## Other Config Options

Create a file in `src/assets/data/secret.ts` and add the following configuration -

```ts
// The End point where the protocols for the questionnaires scheduling is hosted
export const DefaultProtocolEndPointExport: string = 'https://raw.githubusercontent.com/RADAR-base/RADAR-aRMT-protocols/master/'

// The client credentials for OAuth authorisation with the Management Portal
export const DefaultSourceProducerAndSecretExport: string = '<aRMT-client>:<aRMT-secret>'
```

Also if using FCM pull notifications instead of the local ones, please specify the FCM sender id (as mentioned in FCM settings) in `src/assets/data/defaultConfig.ts`

```ts
export const FCMPluginProjectSenderId: string = 'your-sender-id'
```

Also change the Default endpoint of where the RADAR-base platform is hosted.

```ts
export const DefaultEndPoint: string = 'https://your-hosted-radar-platform-base-url/'
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
