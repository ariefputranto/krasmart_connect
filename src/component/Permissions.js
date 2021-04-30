import { PermissionsAndroid } from 'react-native'

// request camera permission
const requestCameraPermission = async () => {
  try {
    const checkPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
    if (!checkPermission) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      )
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("You can use the camera")
      } else {
        console.log("Camera permission denied")
      }
    }
  } catch (err) {
    console.warn(err)
  }
}

export { requestCameraPermission }