import React, { Component, useState, useEffect, useRef, useContext } from 'react'
import { Dimensions, Alert, ToastAndroid, Platform, AlertIOS } from 'react-native'
import { WebView } from 'react-native-webview'
import { decode } from 'html-entities'

import * as Notifications from 'expo-notifications'

import { manualSplashScreen, hideSplashScreen } from './SplashScreen'
import { requestCameraPermission } from './Permissions'
import { PushNotification } from './PushNotifications'
import { lockScreenOrientation } from './LockScreenOrientation'
import { DownloadFiles } from './DownloadFiles'
import { notifyMessage } from './NotifMessage'

import { StoreContext } from '../store/Store';


const KrasmartConnect = () => {
  const { URL, listDownloadUrl, injectedJs, injectedAfterLoadJs, setInjectedAfterLoadJs } = useContext(StoreContext)
  const { initilizePushNotif, subscribeNotification, unSubscribeNotification } = PushNotification()
  const { preventOpeningNewWindow } = DownloadFiles()
  const webViewRef = useRef()
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // initialize component
  useEffect(() => {
    requestCameraPermission()
    manualSplashScreen()
    preventOpeningNewWindow()
    initilizePushNotif()
    lockScreenOrientation()
  }, [])

  // initialize push notif get last notif
  useEffect(() => {
    console.log('lastNotificationResponse', lastNotificationResponse)
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.trigger.remoteMessage.data &&
      lastNotificationResponse.notification.request.trigger.remoteMessage.data.hasOwnProperty('url') &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      onNotificationCallback(lastNotificationResponse.notification.request.trigger.remoteMessage.data)
    }
  }, [lastNotificationResponse]);

  const onNotificationCallback = (notificationData) => {
    webViewRef.current.stopLoading()
    webViewRef.current.injectJavaScript(`
      window.location.href = "`+ decode(notificationData.url) +`"
    `)
  }

  // check the message from KS website
  const checkMessage = (event) => {
    var data = JSON.parse(event.nativeEvent.data)
    if (data.status == "subscribe") {
      subscribeNotification(() => {
        webViewRef.current.reload()
      })
    } else {
      unSubscribeNotification(() => {
        webViewRef.current.reload()
      })
    }
  }

  // check navigation is it on download file or not
  const checkNavigation = (request) => {
    var requestUrl = request.url
    listDownloadUrl.forEach( function(element, index) {
      if (requestUrl.indexOf(element) !== -1) {
        // downloadFile(requestUrl)

        // hide loading
        webViewRef.current.injectJavaScript(`
          setTimeout(() => {
            $('#pageload').addClass('d-none')
          }, 500)
        `)

        // stop loading
        // webViewRef.current.stopLoading()
        // return false
      }
    })

    return request.url.startsWith(URL)
  }

  const loadStartEvent = () => {
    webViewRef.current.injectJavaScript(`
      $('#pageload').removeClass('d-none')
    `)
  }

  const loadEndEvent = () => {
    hideSplashScreen()
    webViewRef.current.injectJavaScript(`
      $('#pageload').addClass('d-none')
    `)
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
      onLoadStart={ loadStartEvent }
      onLoadEnd={ loadEndEvent }
      />
  )
}

export default KrasmartConnect