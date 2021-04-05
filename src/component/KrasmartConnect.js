import React, { Component } from 'react';
import { Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const KrasmartConnect = () => {
  return (
    <WebView
    	startInLoadingState={true} 
    	style = {{width: Dimensions.get('window').width, height: Dimensions.get('window').height}} 
    	source={{ uri: 'https://connect.krasmart.com/'}}
      />
  )
}

export default KrasmartConnect