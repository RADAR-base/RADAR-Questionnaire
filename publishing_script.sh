# Step 1: Build the Ionic app and sync it with the Capacitor Android project
ionic build          # This compiles the app and places the web assets in the 'www' folder
npx cap sync android # Syncs the web assets to the Android project in 'android/app/src/main/assets'

# Step 2: Build the Android app in release mode with Gradle to generate an AAB
cd android              # Navigate to the Android project folder
./gradlew bundleRelease # Assemble the release AAB

# The output AAB file will be located here:
# android/app/build/outputs/bundle/release/app-release.aab

# Move the AAB to your desired output location
mv app/build/outputs/bundle/release/app-release.aab ~/Downloads/radar-armt-app-$1.aab
