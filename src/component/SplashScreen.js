import * as SplashScreen from 'expo-splash-screen'

// show splash screen
const manualSplashScreen = async () => {
  try {
    // Keep the splash screen visible while we fetch resources
    await SplashScreen.preventAutoHideAsync()
  } catch (e) {
    console.warn(e)
  }
}

// hide splash screen
const hideSplashScreen = async () => {
  try {
    await SplashScreen.hideAsync()
  } catch (e) {
    console.warn(e)
  }
}

export { manualSplashScreen, hideSplashScreen }