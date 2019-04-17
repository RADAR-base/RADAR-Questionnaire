## RADAR-Questionnaire

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/cccda70b98d040a09addbcc2b772f6f8)](https://app.codacy.com/app/yatharthranjan89/RADAR-Questionnaire?utm_source=github.com&utm_medium=referral&utm_content=RADAR-base/RADAR-Questionnaire&utm_campaign=Badge_Grade_Settings)
[![bitHound Dependencies](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/badges/dependencies.svg)](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/develop/dependencies/npm) [![bitHound Dev Dependencies](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/badges/devDependencies.svg)](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/develop/dependencies/npm)

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
