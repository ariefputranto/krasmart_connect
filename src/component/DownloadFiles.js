import React, { useContext } from 'react'

import * as Notifications from 'expo-notifications'
import * as FileSystem from 'expo-file-system'
import * as MediaLibrary from 'expo-media-library'

import { notifyMessage } from './NotifMessage'
import { StoreContext } from '../store/Store';

const DownloadFiles = () => {
  const { URL, setInjectedAfterLoadJs } = useContext(StoreContext)

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
	    })

	    // order detail download signed contract
	    $('#download-signed-contract').off('click')
	    $('#download-signed-contract').click(function (e) {
	      e.preventDefault()
	      var url = $(this).data('url')
	      window.location.href = url
	    })

	    // order detail download proof of payment
	    $('#download-proof-of-payment').off('click')
	    $('#download-proof-of-payment').click(function (e) {
	      e.preventDefault()
	      var url = $(this).data('url')
	      window.location.href = url
	    })
	  `)
	}

	const saveFileAsyncAndroid = async (uri) => {
	  try {
	    const { status } = await MediaLibrary.requestPermissionsAsync()
	    if (status === "granted") {
	      const asset = await MediaLibrary.createAssetAsync(uri)
	      const album = await MediaLibrary.getAlbumAsync('Download')
	      if (album === null) {
	        await MediaLibrary.createAlbumAsync('Download', asset, false)
	      } else {
	        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false)
	      }
	      return true
	    }
	    return false
	  } catch (error) {
	    console.log(error)
	  }
	}

	// download file function
	const downloadFile = async (requestUrl) => {
	  const callback = downloadProgress => {
	    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
	  }

	  const downloadResumable = FileSystem.createDownloadResumable(
	    requestUrl,
	    FileSystem.cacheDirectory + new Date().getTime(),
	    {},
	    callback
	  )

	  try {
	    notifyMessage('Downloading file!')
	    const { uri, headers } = await downloadResumable.downloadAsync()

	    // lowercase headers
	    Object.keys(headers)
	      .reduce((destination, key) => {
	        destination[key.toLowerCase()] = headers[key]
	        return destination
	      }, {})

	    // extract filename
	    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
	    var matches = filenameRegex.exec(headers['content-disposition'])
	    var filename = ""
	    if (matches != null && matches[1]) { 
	      filename = matches[1].replace(/['"]/g, '')
	      filename = filename.split(' ').join('_')
	    }

	    if (filename.length == 0) {
	      notifyMessage('File name is empty!')
	      return
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
	    console.error(e)
	  }
	}

	return { preventOpeningNewWindow, saveFileAsyncAndroid, downloadFile }
}

export { DownloadFiles }