import React, { Component, useState, useEffect, useRef, useContext } from 'react'
import { Dimensions, Alert, ToastAndroid, Platform, AlertIOS } from 'react-native'
import { WebView } from 'react-native-webview'
import { decode } from 'html-entities'

import { showSplashScreen, hideSplashScreen } from './SplashScreen'
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

  // initialize push notification token
  useEffect(() => {
    requestCameraPermission()
    showSplashScreen()
    preventOpeningNewWindow()
    initilizePushNotif(onNotificationCallback)
    lockScreenOrientation()
  }, [])

  const onNotificationCallback = (notificationData) => {
    console.log(notificationData)
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
      }, onNotificationCallback)
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
      onLoadEnd={ hideSplashScreen }
      />
  )
}

export default KrasmartConnect