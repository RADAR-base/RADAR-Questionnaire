import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'org.phidatalab.radar_armt',
  appName: 'RADAR Questionnaire',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  loggingBehavior: 'none',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  },
  cordova: {
    preferences: {
      DisallowOverscroll: 'true',
      BackgroundColor: '0xff6d9aa5',
      Orientation: 'portrait',
      SplashScreen: 'screen',
      SplashScreenBackgroundColor: '0xff6d9aa5',
      FadeSplashScreen: 'true',
      FadeSplashScreenDuration: '1000',
      SplashScreenDelay: '3000',
      AutoHideSplashScreen: 'false',
      LoadUrlTimeoutValue: '700000',
      ShowSplashScreenSpinner: 'false',
      SplashScreenSpinnerColor: '0xffffffff',
      SplashMaintainAspectRatio: 'true',
      SplashShowOnlyFirstTime: 'false'
    }
  }
}

export default config
