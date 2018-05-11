## RADAR-Questionnaire

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

Add the following lines into `platforms/android/build.gradle` to solve the problem of 'resource android:attr/fontVariationSettings not found' when running 'cordova build'

>configurations.all {
>    resolutionStrategy {
>        force 'com.android.support:support-v4:27.1.0'
>    }
>}

### Customize the App

You need to modify DefaultEndPoint, DefaultProtocolEndPoint and DefaultSourceProducerAndSecret in `src/assets/data/defaultConfig.ts` to make the app work with your project.
You need to have different 'widget id' in `config.xml`.
