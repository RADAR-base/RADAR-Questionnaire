ionic cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/Downloads/radar-armt-release-key.keystore platforms/android/build/outputs/apk/release/android-release-unsigned.apk alias_name

 ~/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 platforms/android/build/outputs/apk/release/android-release-unsigned.apk /Users/yatharth/Radar/RADAR-Questionnaire-apks/radar-armt-app-$1.apk
