export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function convertBase64ToBlob(
  base64Data,
  contentType = "",
  sliceSize = 512
) {
  // Log the initial input values
  console.log("Initial base64 data:", base64Data);
  console.log("Initial content type:", contentType);

  // Handle base64 data that might have a prefix like 'data:image/png;base64,'
  if (base64Data.startsWith("data:")) {
    const base64Parts = base64Data.split(",");
    base64Data = base64Parts[1]; // Take only the base64 part, ignore the metadata
    contentType = contentType || base64Parts[0].split(":")[1].split(";")[0]; // Extract content type from metadata if not provided

    // Log the metadata extraction
    console.log("Base64 data after split:", base64Data);
    console.log("Extracted content type:", contentType);
  }

  const byteCharacters = atob(base64Data);
  console.log("Decoded base64 string length:", byteCharacters.length);

  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  // console.log("Final Blob size:", byteArrays.length);

  return new Blob(byteArrays, { type: contentType });
}

export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(() => {});
    return {
      ready: Promise.resolve(), // tidak lagi reject
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }
  return document.startViewTransition(updateDOM);
}

export function setupSkipToContent(skipButton, contentElement) {
  if (!skipButton || !contentElement) {
    console.warn("Skip to content gagal: elemen tidak ditemukan.");
    return;
  }

  skipButton.addEventListener("click", (event) => {
    event.preventDefault();
    contentElement.setAttribute("tabindex", "-1");
    contentElement.focus();
  });
}

export function isServiceWorkerAvailable() {
  return "serviceWorker" in navigator;
}

export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log("Service Worker API unsupported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "/sw.bundle.js"
    );
    console.log("Service worker telah terpasang", registration);
  } catch (error) {
    console.log("Failed to install service worker:", error);
  }
}
