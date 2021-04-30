import * as Device from 'expo-device'
import * as ScreenOrientation from 'expo-screen-orientation'

// lock screen orientation
const lockScreenOrientation = async () => {
	try {
	  var deviceType = await Device.getDeviceTypeAsync()
	  if (deviceType == Device.DeviceType.TABLET) {
	    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
	  } else {
	    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT)
	  }
	} catch(e) {
	  console.log(e)
	}
}

export { lockScreenOrientation }