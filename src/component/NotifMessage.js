import { Alert, ToastAndroid, Platform, AlertIOS } from 'react-native'

// toast
const notifyMessage = (msg: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT)
  } else if (Platform.OS === 'ios') {
    AlertIOS.alert(msg)
  } else {
    Alert.alert(msg)
  }
}

export { notifyMessage }