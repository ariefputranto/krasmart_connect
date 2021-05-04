import React, { createContext, useState } from 'react';

export const StoreContext = createContext(null)
export const StoreProvider = ({children}) => {
  // const URL = "https://connect.krasmart.com/"
  // const URL = "https://krasmart-connect.sharedwithexpose.com"
  const URL = "http://192.168.18.8:8080"

  const listDownloadUrl = [
    'service/claim_damage/downloadFile',
    'service/document/download',
    'service/order/downloadSignedContract',
    'service/order/downloadProofOfPayment',
    'service/export_excel/orders'
  ]

  const [injectedJs, setInjectedJs] = useState("")
  const [injectedAfterLoadJs, setInjectedAfterLoadJs] = useState("")

	const store = {
		URL,
		listDownloadUrl,
		injectedJs, setInjectedJs,
		injectedAfterLoadJs, setInjectedAfterLoadJs
	}

	return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}