import { getAccessToken } from "../utils/auth";
import CONFIG from "../config.js";

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  GUEST_STORY: `${CONFIG.BASE_URL}/stories/guest`,
  NOTIFICATIONS: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

// === Helper ===
async function handleResponse(response) {
  const json = await response.json();
  if (!response.ok) {
    console.error("Error response:", json.message || "Terjadi kesalahan.");
    throw new Error(json.message || "Terjadi kesalahan.");
  }
  return json;
}

// === AUTH ===
export async function getRegistered({ name, email, password }) {
  console.log("Mencoba register dengan data:", { name, email, password });
  try {
    const response = await fetch(ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(response);
    console.log("Register berhasil:", data);
    return { ...data, ok: true };
  } catch (error) {
    console.error("Register error:", error.message);
    return { message: error.message, ok: false };
  }
}

// === LOGIN ===
export async function getLogin({ email, password }) {
  // console.log('Mencoba login dengan:', { email, password });
  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    console.log("Login berhasil:", data);
    return { ...data, ok: true };
  } catch (error) {
    console.error("Login error:", error.message);
    return { message: error.message, ok: false };
  }
}

// ===  ADD NEW STORIES ===
export const addNewStory = async (description, photo, lat, lon, token) => {
  // console.log('Token in localStorage:', localStorage.getItem('token')); // <== di sini

  if (!token) {
    throw new Error("Token tidak tersedia");
  }

  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat) formData.append("lat", lat);
  if (lon) formData.append("lon", lon);

  // Setelah menambahkan data ke FormData, log seluruh entri
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Gagal menambahkan cerita");
  }

  return result;
};

// ===  ADD NEW STORIES GUEST ===
export const guestNewAddStory = async ({ description, photo, lat, lon }) => {
  const formData = new FormData();

  let hasError = false;

  if (description?.trim()) {
    formData.append("description", description.trim());
  } else {
    console.error("Description is missing");
    hasError = true;
  }

  if (lat !== undefined && lat !== null && lat !== "") {
    formData.append("lat", lat);
  } else {
    console.error("Latitude is missing");
  }

  if (lon !== undefined && lon !== null && lon !== "") {
    formData.append("lon", lon);
  } else {
    console.error("Longitude is missing");
  }

  if (photo instanceof File) {
    formData.append("photo", photo);
  } else {
    console.error("Photo is missing or invalid");
    hasError = true;
  }

  if (hasError) {
    throw new Error("Form submission blocked due to missing or invalid fields");
  }

  const response = await fetch(ENDPOINTS.GUEST_STORY, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
  }

  return await response.json();
};

// === GET ALL STORIES ===
export async function getAllStories({ page = 1, size = 10, location = 0 }) {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak tersedia");
  const url = `${ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    throw error;
  }
}

// === GET DETAIL STORIES ===
export async function getStoryDetail(id) {
  const token = getAccessToken();
  if (!token) throw new Error("Token tidak tersedia");

  // console.log(`🔍 Mengambil detail story dengan ID: ${id}`);
  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
}

// === NOTIFICATIONS SUBSCRIBE ===
export const subscribeNotification = async (subscriptionData) => {
  // console.log("Data subscription yang dikirim ke server:", subscriptionData);

  const token = getAccessToken(); // Pastikan token ada dan valid
  if (!token) throw new Error("Token tidak tersedia"); // Periksa apakah token tersedia

  try {
    // Kirim request POST ke server untuk subscribe
    const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Tambahkan token untuk otentikasi
      },
      body: JSON.stringify(subscriptionData), // Kirimkan subscription data
    });

    // Menangani respons dari server
    const data = await handleResponse(response);
    // console.log("Berhasil subscribe notifikasi:", data);

    // Mengembalikan data respons dengan status ok true
    return { ...data, ok: true };
  } catch (error) {
    console.error("Gagal subscribe notifikasi:", error.message);

    // Mengembalikan pesan error
    return { message: error.message, ok: false };
  }
};

// === NOTIFICATIONS UNSUBSCRIBE ===
export const unsubscribeNotification = async (endpoint) => {
  const token = getAccessToken(); // Pastikan token ada dan valid
  if (!token) throw new Error("Token tidak tersedia");

  try {
    // Kirim request DELETE untuk unsubscribe
    const response = await fetch(ENDPOINTS.NOTIFICATIONS, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`, // Pastikan token ada untuk autentikasi
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ endpoint }), // Kirim endpoint untuk berhenti berlangganan
    });

    // Menangani respons dari server
    const data = await handleResponse(response);
    // console.log("Berhasil unsubscribe notifikasi:", data);

    // Mengembalikan data respons dengan status ok true
    return { ...data, ok: true };
  } catch (error) {
    console.error("Gagal unsubscribe notifikasi:", error.message);

    // Mengembalikan pesan error
    return { message: error.message, ok: false };
  }
};
