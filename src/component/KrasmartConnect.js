import React, { Component } from 'react';
import { Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const KrasmartConnect = () => {
	const jsCode = `document.querySelector('.dashboard-panel .alert-wrapper').style.display = 'none';`;

  return (
    <WebView
    	startInLoadingState = {true} 
    	style = {{width: Dimensions.get('window').width, height: Dimensions.get('window').height}} 
    	source = {{ uri: 'https://connect.krasmart.com/'}}
    	userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36"
      />
  )
}

export default KrasmartConnect