ionic cordova build --release android

~/Library/Android/sdk/build-tools/28.0.3/zipalign -v 4 platforms/android/app/build/outputs/apk/release/app-release-unsigned.apk ~/Downloads/radar-armt-app-zipaligned.apk

~/Library/Android/sdk/build-tools/28.0.3/apksigner sign -v --out ~/Downloads/radar-armt-app-$1.apk --ks ~/Downloads/radar-armt-release-key.keystore --ks-key-alias alias_name ~/Downloads/radar-armt-app-zipaligned.apk

