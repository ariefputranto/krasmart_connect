import { Component, useState, useRef, useContext } from 'react'
import { Platform } from 'react-native'

import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'

import axios from 'axios'

import { notifyMessage } from './NotifMessage'
import { StoreContext } from '../store/Store'

// register push notification
const registerForPushNotificationsAsync = async () => {
  let token
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') {
      notifyMessage('Failed to get push token for push notification!')
      return
    }
    token = (await Notifications.getDevicePushTokenAsync()).data
    console.log(token)
  } else {
    notifyMessage('Must use physical device for Push Notifications')
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  await SecureStore.setItemAsync('token', token)
  return token
}

const PushNotification = () => {
  // configure notification
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  })

  const { URL, setInjectedJs } = useContext(StoreContext)
  const [expoPushToken, setExpoPushToken] = useState('')
  const [notification, setNotification] = useState(false)
  const notificationListener = useRef()
  // const responseListener = useRef()

  // initialize push notif
  const initilizePushNotif = async (onNotificationCallback) => {
    try {
      var currentToken = await SecureStore.getItemAsync('token')
      if (currentToken) {
        setExpoPushToken(currentToken)
        setInjectedJs(`
          window['isPushNotificationEnabled'] = true
        `)
        initializeSubscribeListener(onNotificationCallback)
      }
    } catch(e) {
      console.log('error', e)
    } 
  }

  // remove push notif token
  const removeToken = async () => {
    await SecureStore.deleteItemAsync('token')
    setInjectedJs(`
      window['isPushNotificationEnabled'] = false
    `)
  }

  // initialize subscribe listener
  const initializeSubscribeListener = (onNotificationCallback) => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification)
    })

    // responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
    //   // add on click redirect into link
    //   if (Platform.OS === 'android') {
    //     var data = response.notification.request.trigger.remoteMessage.data

    //     // sanitize url before redirecting
    //     if (data.hasOwnProperty('url')) {
    //       onNotificationCallback(data)
    //     }
    //   }
    // })
  }

  // subscribe notification
  const subscribeNotification = (axiosCallback, onNotificationCallback) => {
    registerForPushNotificationsAsync().then(token => {
      initilizePushNotif()

      var params = {
        "fcm_token": token
      }

      axios.post(URL + '/index.php?route=service/pushnotification/subscribeNotification', params).then(async response => {
        if (response.data.status == "success") {
          notifyMessage('Successfully enabled push notification!')
          setTimeout(() => {
            axiosCallback()
          }, 500)
        } else {
          notifyMessage('Something went wrong!')
        }
      }, error => {
        notifyMessage(error.message)
      })
    })

    initializeSubscribeListener(onNotificationCallback)
  }

  // un-subscribe notification
  const unSubscribeNotification = (successCallback) => {
    Notifications.removeNotificationSubscription(notificationListener)
    // Notifications.removeNotificationSubscription(responseListener)
    removeToken()

    var params = {
      "fcm_token": expoPushToken
    }

    axios.post(URL + '/index.php?route=service/pushnotification/unSubscribeNotification', params).then(async response => {
      if (response.data.status == "success") {
        notifyMessage('Successfully disabled push notification!')
        setTimeout(() => {
          successCallback()
        }, 500)
      } else {
        notifyMessage('Something went wrong!')
      }
    }, error => {
      notifyMessage(error.message)
    })
  }

  return {initilizePushNotif, subscribeNotification, unSubscribeNotification}
}

export { PushNotification }