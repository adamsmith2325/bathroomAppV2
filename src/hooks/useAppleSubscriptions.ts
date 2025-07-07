// // src/hooks/useAppleSubscriptions.ts
// import * as InAppPurchases from 'expo-in-app-purchases'
// import { useEffect, useState } from 'react'

// export function useAppleSubscriptions() {
//   const [products, setProducts] = useState<InAppPurchases.IAPItemDetails[]>([])

//   useEffect(() => {
//     // 1️⃣ connect & fetch product listings
//     InAppPurchases.connectAsync()
//       .then(() =>
//         InAppPurchases.getProductsAsync([
//           'com.yourcompany.yourapp.premium_monthly',
//           'com.yourcompany.yourapp.premium_yearly',
//         ])
//       )
//       .then(({ responseCode, results }) => {
//         if (responseCode === InAppPurchases.IAPResponseCode.OK) {
//           setProducts(results)
//         } else {
//           console.warn('IAP › getProductsAsync failed:', responseCode)
//         }
//       })

//     // 2️⃣ listen for completed purchases
//     const sub = InAppPurchases.setPurchaseListener(({ responseCode, results }) => {
//       if (responseCode === InAppPurchases.IAPResponseCode.OK) {
//         for (const purchase of results) {
//           // TODO → verify purchase.transactionReceipt on your Edge Function
//           // InAppPurchases.finishTransactionAsync(purchase, true)
//         }
//       } else {
//         console.warn('IAP › purchase listener saw bad response:', responseCode)
//       }
//     })

//     // teardown
//     return () => {
//       sub.remove()
//       InAppPurchases.disconnectAsync()
//     }
//   }, [])

//   return products
// }
