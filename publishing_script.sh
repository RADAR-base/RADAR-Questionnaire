ionic cordova build --release android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore ~/Documents/AllocModulo/RADAR/Dev/Application-Keys/Android/radar-armt-release-key.keystore platforms/android/build/outputs/apk/release/android-release-unsigned.apk alias_name

/usr/local/opt/android-sdk/build-tools/27.0.1/zipalign -v 4 platforms/android/build/outputs/apk/release/android-release-unsigned.apk ~/Documents/AllocModulo/RADAR/Dev/Application-Signed-Binaries/radar-armt-app-$1.apk
