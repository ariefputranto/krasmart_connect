import React, { Component, useState, useEffect, useRef } from 'react';
import { Dimensions, Alert, ToastAndroid, Platform, AlertIOS } from 'react-native';
import { WebView } from 'react-native-webview';

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import axios from 'axios'
import {decode} from 'html-entities';


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
      notifyMessage('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getDevicePushTokenAsync()).data
    console.log(token);
  } else {
    notifyMessage('Must use physical device for Push Notifications');
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
  const URL = "https://connect.krasmart.com/"
  const listDownloadUrl = [
    'service/claim_damage/downloadFile',
    'service/document/download',
    'service/order/downloadSignedContract',
    'service/order/downloadProofOfPayment'
  ]

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [injectedJs, setInjectedJs] = useState("");
  const [injectedAfterLoadJs, setInjectedAfterLoadJs] = useState("");
  const notificationListener = useRef();
  const responseListener = useRef();
  const webViewRef = useRef();

  // initialize push notification token
  useEffect(() => {
    preventOpeningNewWindow()
    initilizePushNotif()
    lockScreenOrientation()
  }, [])

  // remove target _blank from url
  const preventOpeningNewWindow = async () => {
    setInjectedAfterLoadJs(`
      $('a').removeAttr('target')

      // claim damage
      $('#claimModal').off('click', '.get-upload')
      $('#claimModal').on('click', '.get-upload', function(event) {
        var file_name = $(this).data('file-name')
        var url = $(this).data('url') + '&file_name=' + file_name
        window.location.href = url
      });

      // order detail download signed contract
      $('#download-signed-contract').off('click')
      $('#download-signed-contract').click(function (e) {
        e.preventDefault();
        var url = $(this).data('url')
        window.location.href = url
      });

      // order detail download proof of payment
      $('#download-proof-of-payment').off('click')
      $('#download-proof-of-payment').click(function (e) {
        e.preventDefault();
        var url = $(this).data('url')
        window.location.href = url
      });
    `)
  }

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
      console.log(e);
    }
  }

  const removeToken = async () => {
    await SecureStore.deleteItemAsync('token')
    setInjectedJs(`
      window['isPushNotificationEnabled'] = false
    `)
  }

  // subscribe notification
  const subscribeNotification = () => {
    registerForPushNotificationsAsync().then(token => {
      initilizePushNotif()

      var params = {
        "fcm_token": token
      }

      axios.post(URL + '/index.php?route=service/pushnotification/subscribeNotification', params).then(async response => {
        if (response.data.status == "success") {
          notifyMessage('Success!', 'Successfully enabled push notification!')
          setTimeout(() => {
            webViewRef.current.reload();
          }, 500)
        } else {
          notifyMessage('Warning!', 'Something went wrong!')
        }
      }, error => {
        notifyMessage('Warning!', error.message)
      })
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      // add on click redirect into link
      if (Platform.OS === 'android') {
        var data = response.notification.request.trigger.remoteMessage.data

        // sanitize url before redirecting
        if (data.hasOwnProperty('url')) {
          webViewRef.current.injectJavaScript(`
            window.location.href = "`+ decode(data.url) +`"
          `);
        }
      }
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
        notifyMessage('Success!', 'Successfully disabled push notification!')
        setTimeout(() => {
          webViewRef.current.reload();
        }, 500)
      } else {
        notifyMessage('Warning!', 'Something went wrong!')
      }
    }, error => {
      notifyMessage('Warning!', error.message)
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

  const saveFileAsyncAndroid = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === "granted") {
        const asset = await MediaLibrary.createAssetAsync(uri);
        const album = await MediaLibrary.getAlbumAsync('Download');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('Download', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        return true
      }
      return false
    } catch (error) {
      console.log(error);
    }
  }

  // download file function
  const downloadFile = async (requestUrl) => {
    const callback = downloadProgress => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    };

    const downloadResumable = FileSystem.createDownloadResumable(
      requestUrl,
      FileSystem.cacheDirectory + new Date().getTime(),
      {},
      callback
    );

    try {
      notifyMessage('Downloading file!')
      const { uri, headers } = await downloadResumable.downloadAsync();

      // extract filename
      var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      var matches = filenameRegex.exec(headers['Content-Disposition']);
      var filename = "";
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '')
        filename = filename.split(' ').join('_')
      }

      // rename file
      console.log('file name: ', filename)
      var newUri = FileSystem.cacheDirectory + filename
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      })

      // move to download
      if (Platform.OS === 'android') {
        var successSaveFile = await saveFileAsyncAndroid(newUri)
        if (successSaveFile) {
          notifyMessage('Successfully downloaded file!')

          // push notif download is complete
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Download is completed!',
              body: filename,
            },
            trigger: null,
          })
        }
      }

    } catch (e) {
      console.error(e);
    }
  }

  // check navigation is it on download file or not
  const checkNavigation = (request) => {
    var requestUrl = request.url
    listDownloadUrl.forEach( function(element, index) {
      if (requestUrl.indexOf(element) !== -1) {
        downloadFile(requestUrl)

        // hide loading
        webViewRef.current.injectJavaScript(`$('#pageload').addClass('d-none')`)

        // stop loading
        webViewRef.current.stopLoading()
        return false;
      }
    })

    return request.url.startsWith(URL);
  }

  // toast
  function notifyMessage(msg: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT)
    } else if (Platform.OS === 'ios') {
      AlertIOS.alert(msg);
    } else {
      Alert.alert(msg);
    }
  }

  return (
    <WebView
    	startInLoadingState = {true} 
      ref={(ref) => webViewRef.current = ref}
    	style = {{width: Dimensions.get('window').width, height: Dimensions.get('window').height}}
    	source = {{ uri: URL}}
    	userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
    	onMessage = {(event) => { checkMessage(event) }}
      injectedJavaScriptBeforeContentLoaded = { injectedJs }
      injectedJavaScript = { injectedAfterLoadJs }
      cacheEnabled = { false }
      cacheMode = { 'LOAD_NO_CACHE' }
      onShouldStartLoadWithRequest={ checkNavigation }
      />
  )
}

export default KrasmartConnect