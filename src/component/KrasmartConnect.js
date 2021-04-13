import React, { Component, useState, useEffect, useRef } from 'react';
import { Dimensions, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import axios from 'axios'
import * as SecureStore from 'expo-secure-store';

// configure notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// register push notification
async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getDevicePushTokenAsync()).data
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  await SecureStore.setItemAsync('token', token)
  return token;
}

const KrasmartConnect = () => {
  const URL = "http://connect.krasmart.com/"
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [injectedJs, setInjectedJs] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();

  // initialize push notification token
  useEffect(() => {
    initilizePushNotif()
  }, [])

  // initialize push notif
  const initilizePushNotif = async () => {
    try {
      var currentToken = await SecureStore.getItemAsync('token')
      if (currentToken) {
        setExpoPushToken(currentToken)
        setInjectedJs(`
          window['isPushNotificationEnabled'] = true
        `)
      }
    } catch(e) {
      console.log('error', e);
    } 
  }

  const removeToken = async () => {
    await SecureStore.deleteItemAsync('token')
  }

  // subscribe notification
  const subscribeNotification = () => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token)

      var params = {
        "fcm_token": token
      }

      axios.post(URL + '/index.php?route=service/pushnotification/subscribeNotification', params).then(async response => {
        if (response.data.status == "success") {
          Alert.alert('Success!', 'Successfully enabled push notification!')
        } else {
          Alert.alert('Warning!', 'Something went wrong!')
        }
      }, error => {
        Alert.alert('Warning!', error.message)
      })
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });
  }

  // un-subscribe notification
  const unSubscribeNotification = () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
    removeToken()

    var params = {
      "fcm_token": expoPushToken
    }

    axios.post(URL + '/index.php?route=service/pushnotification/unSubscribeNotification', params).then(async response => {
      if (response.data.status == "success") {
        Alert.alert('Success!', 'Successfully disabled push notification!')
      } else {
        Alert.alert('Warning!', 'Something went wrong!')
      }
    }, error => {
      Alert.alert('Warning!', error.message)
    })
  }

  // check the message from KS website
  const checkMessage = (event) => {
    var data = JSON.parse(event.nativeEvent.data)
    if (data.status == "subscribe") {
      subscribeNotification()
    } else {
      unSubscribeNotification()
    }
  }

  return (
    <WebView
    	startInLoadingState = {true} 
    	style = {{width: Dimensions.get('window').width, height: Dimensions.get('window').height}} 
    	// source = {{ uri: 'https://connect.krasmart.com/'}}
    	// source = {{ uri: 'http://localhost:8080/'}}
    	source = {{ uri: URL}}
    	userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
    	onMessage = {(event) => { checkMessage(event) }}
      injectedJavaScriptBeforeContentLoaded = { injectedJs }
      cacheEnabled = { false }
      cacheMode = { 'LOAD_NO_CACHE' }
      />
  )
}

export default KrasmartConnect