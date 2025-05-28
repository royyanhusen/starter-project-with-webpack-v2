import { subscribeNotification, unsubscribeNotification } from "../../scripts/data/api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// export async function subscribeUser(token) {
//   if (!("serviceWorker" in navigator)) return false;
//   try {
//     const registration = await navigator.serviceWorker.ready;
//     const subscription = await registration.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: urlBase64ToUint8Array("BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"),
//     });
    
//     // Kirim subscription ke backend via API
//     const response = await subscribeNotification({
//       endpoint: subscription.endpoint,
//       keys: subscription.toJSON().keys,
//     }, token);

//     return response.ok;
//   } catch (error) {
//     console.error("Subscribe error:", error);
//     return false;
//   }
// }


export async function subscribeUser(token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Notification permission not granted");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"
        ),
      });
    }

    const response = await subscribeNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
      },
      token
    );

    return response.ok;
  } catch (error) {
    console.error("Subscribe error:", error);
    return false;
  }
}



export async function unsubscribeUser(token) {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    const response = await unsubscribeNotification(subscription.endpoint, token);
    if (response.ok) {
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return false;
  }
}
