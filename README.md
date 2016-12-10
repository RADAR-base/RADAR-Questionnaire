## RADAR-Questionnaire

[![bitHound Dependencies](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/badges/dependencies.svg)](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/develop/dependencies/npm) [![bitHound Dev Dependencies](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/badges/devDependencies.svg)](https://www.bithound.io/github/RADAR-CNS/RADAR-Questionnaire/develop/dependencies/npm)

Hybrid mobile application to actively capture data for the RADAR-CNS Platform.

## Note

We use the [Ionic 2 framework](http://ionicframework.com/docs/v2/), which is built with [Angular 2](https://angular.io/) and wraps [Apache Cordova](https://cordova.apache.org/).

## Install

First install [Node.js](https://nodejs.org/) and [Yarn](https://yarnpkg.com/en/docs/install).

Globally install ionic and cordova:
```
$ npm install -g ionic cordova
```

In the project folder run `yarn` to install dependencies:
```
$ yarn
```

To run the application in the browser use:
```
$ ionic serve
```

### Android

To add the Android platform. You need to have the [Android SDK](https://developer.android.com/studio/index.html) pre installed. This step also adds the plugins listed in `config.xml` to the project.
```
$ ionic platform add android
```

Run the app in an Android device:
```
$ ionic run android
```

Run the app in an Android emulator:
```
$ ionic emulate android
```
