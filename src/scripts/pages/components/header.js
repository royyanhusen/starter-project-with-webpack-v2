import { subscribeUser, unsubscribeUser } from "../../utils/pushNotifications";

export default class Header {
  constructor() {
    this.headerElement = null;
    this.isSubscribed = false;
    this.notifications = [];
    this.viewedIds = [];
  }

  render() {
    return this.createHeader();
  }

  createHeader() {
    const header = document.createElement("header");
    header.classList.add("main-header", "container");

    header.innerHTML = `
    <a class="brand-name__link" href="#/">
      <img class="brand-name__link__image" src="images/logo.png" alt="Story App Logo" />
      <span class="brand-name__link__text">Story App</span>
    </a>

    <nav id="navigation-drawer" class="navigation-drawer">
      <ul id="nav-list" class="nav-list">
        <li><a href="#/">Daftar Story</a></li>
        <li><a id="bookmark-button" class="bookmark-button" href="#/bookmark">Story Tersimpan</a></li>
        
        <li>
          <a id="subscribe-button" class="notif-button subscribe-active" role="button" tabindex="0">
            <i class="fas fa-bell"></i> Subscribe
          </a>
        </li>
        
        <li>
          <a href="#/logout" class="logout-button">
            <i class="fas fa-sign-out-alt" style="color: red;"></i> Logout
          </a>
        </li>
      </ul>
    </nav>

    <!-- Notification icon outside drawer -->
    <div id="notif-icon" class="notif-icon hidden" tabindex="0">
      <i class="fas fa-bell"></i>
      <span id="notif-count" class="notif-count">0</span>
    </div>

    <!-- Drawer toggle button -->
    <button id="drawer-button" class="drawer-button" aria-label="Toggle Navigation">☰</button>

    <!-- Notification list outside drawer -->
    <div id="notif-list" class="notif-list hidden">
      <ul id="notif-items"></ul>
    </div>
    `;

    this.headerElement = header;
    return this.headerElement;
  }

  setupDrawer() {
    const drawerButton = this.headerElement.querySelector("#drawer-button");
    const navigationDrawer =
      this.headerElement.querySelector("#navigation-drawer");

    drawerButton.addEventListener("click", (event) => {
      event.stopPropagation();
      navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !navigationDrawer.contains(event.target) &&
        !drawerButton.contains(event.target)
      ) {
        navigationDrawer.classList.remove("open");
      }

      navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  async checkSubscriptionStatus() {
    if (!("serviceWorker" in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.isSubscribed = !!subscription;
      this.updateSubscribeButtonUI();
    } catch (error) {
      console.error("Error checking subscription status:", error);
    }
  }

  updateSubscribeButtonUI() {
    const subscribeButton =
      this.headerElement.querySelector("#subscribe-button");
    const notifIcon = this.headerElement.querySelector("#notif-icon");

    if (this.isSubscribed) {
      subscribeButton.innerHTML = `<i class="fas fa-bell-slash"></i> Unsubscribe`;
      subscribeButton.classList.remove("subscribe-active");
      subscribeButton.classList.add("unsubscribe-active");
      notifIcon.classList.remove("hidden");
    } else {
      subscribeButton.innerHTML = `<i class="fas fa-bell"></i> Subscribe`;
      subscribeButton.classList.remove("unsubscribe-active");
      subscribeButton.classList.add("subscribe-active");
      notifIcon.classList.add("hidden");
    }
  }

  async setupNotificationUI() {
    const subscribeButton =
      this.headerElement.querySelector("#subscribe-button");
    const notifIcon = this.headerElement.querySelector("#notif-icon");
    const notifCount = this.headerElement.querySelector("#notif-count");
    const notifList = this.headerElement.querySelector("#notif-list");
    const notifItems = this.headerElement.querySelector("#notif-items");

    const token = localStorage.getItem("accessToken");

    if (!subscribeButton) {
      console.error("Subscribe button not found");
      return;
    }

    // Load notifications dan viewedIds dari localStorage ke properti this
    try {
      this.notifications = JSON.parse(
        localStorage.getItem("notifications") || "[]"
      );
      if (!Array.isArray(this.notifications)) this.notifications = [];
    } catch {
      this.notifications = [];
    }
    console.log(
      "[setupNotificationUI] Loaded notifications:",
      this.notifications
    );

    try {
      this.viewedIds = JSON.parse(
        localStorage.getItem("viewedStoryIds") || "[]"
      );
      if (!Array.isArray(this.viewedIds)) this.viewedIds = [];
    } catch {
      this.viewedIds = [];
    }
    console.log("[setupNotificationUI] Viewed story IDs:", this.viewedIds);

    // Cek status subscription (pastikan metode ini sudah ada di class dan atur this.isSubscribed)
    await this.checkSubscriptionStatus();

    // Update UI tombol dan icon
    this.updateSubscribeButtonUI();

    // Hitung jumlah notifikasi belum dibaca
    const unread = this.notifications.filter(
      (n) => !this.viewedIds.includes(n.storyId)
    );
    console.log("[setupNotificationUI] Unread notifications:", unread);
    const unreadCount = unread.length;

    notifCount.textContent = unreadCount;
    notifCount.style.visibility = unreadCount === 0 ? "hidden" : "visible";

    // Simpan unreadCount di localStorage
    localStorage.setItem("unreadCount", unreadCount.toString());

    notifIcon.style.display = "inline-block";

    // Render daftar notifikasi
    notifItems.innerHTML = this.notifications
      .map(
        (n) => `
      <li>
        <strong>${n.title}</strong><br/>
        <small>${n.options?.body || ""}</small>
      </li>
    `
      )
      .join("");

    // Event listener klik tombol subscribe/unsubscribe
    subscribeButton.addEventListener("click", async () => {
      if (!token) {
        alert("Anda harus login terlebih dahulu untuk menggunakan notifikasi.");
        return;
      }

      if (!("Notification" in window)) {
        alert("Browser ini tidak mendukung notifikasi.");
        return;
      }

      console.log("Current Notification permission:", Notification.permission);

      if (Notification.permission === "granted") {
        try {
          if (!this.isSubscribed) {
            const success = await subscribeUser(token);
            if (success) {
              this.isSubscribed = true;
              this.updateSubscribeButtonUI();
            }
          } else {
            const success = await unsubscribeUser(token);
            if (success) {
              this.isSubscribed = false;
              this.updateSubscribeButtonUI();

              // Reset data notifikasi dan update UI
              this.notifications = [];
              this.viewedIds = [];
              localStorage.removeItem("notifications");
              localStorage.removeItem("viewedStoryIds");
              localStorage.setItem("unreadCount", "0");

              notifCount.textContent = "0";
              notifCount.style.visibility = "hidden";
              notifItems.innerHTML = "";
            }
          }
        } catch (error) {
          console.error("Error saat subscribe/unsubscribe:", error);
          alert("Terjadi kesalahan. Silakan coba lagi.");
        }
      } else if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        console.log("Permission setelah request:", permission);
        if (permission === "granted") {
          alert(
            "Izin notifikasi diberikan, silakan klik lagi tombol subscribe."
          );
        } else {
          alert(
            "Izin notifikasi tidak diberikan, fitur tidak dapat digunakan."
          );
        }
      } else {
        alert(
          "Izin notifikasi sudah ditolak sebelumnya. Untuk mengaktifkan, ubah pengaturan browser."
        );
      }
    });

    // Keyboard accessibility untuk tombol subscribe/unsubscribe
    subscribeButton.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        subscribeButton.click();
      }
    });

    // Event klik icon notifikasi untuk toggle daftar notifikasi
    notifIcon.addEventListener("click", () => {
      notifList.classList.toggle("hidden");
      const isOpen = !notifList.classList.contains("hidden");

      if (isOpen) {
        try {
          this.notifications = JSON.parse(
            localStorage.getItem("notifications") || "[]"
          );
          if (!Array.isArray(this.notifications)) this.notifications = [];
        } catch {
          this.notifications = [];
        }
        // Tandai semua notifikasi sebagai sudah dilihat
        const allStoryIds = this.notifications
          .map((n) => n.storyId)
          .filter((id) => id != null);

        this.viewedIds = allStoryIds;

        localStorage.setItem("viewedStoryIds", JSON.stringify(allStoryIds));
        localStorage.setItem("unreadCount", "0");

        notifCount.textContent = "0";
        notifCount.style.visibility = "hidden";
        notifIcon.style.color = "red";
      } else {
        notifCount.style.visibility = "visible";
        notifIcon.style.color = "";
      }
    });

    // Keyboard accessibility untuk icon notifikasi
    notifIcon.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        notifIcon.click();
      }
    });
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  listenToServiceWorkerMessages() {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "NEW_PUSH_MESSAGE") {
        const notif = event.data.payload;

        if (!notif.storyId) {
          notif.storyId = this.generateUUID();
        }

        let current = [];
        try {
          current = JSON.parse(localStorage.getItem("notifications") || "[]");
          if (!Array.isArray(current)) current = [];
        } catch {
          current = [];
        }

        if (current.some((n) => n.storyId === notif.storyId)) {
          console.log(
            "[SW Message] Duplicate notification ignored, storyId:",
            notif.storyId
          );
          return;
        }

        current.unshift(notif);
        localStorage.setItem("notifications", JSON.stringify(current));

        console.log("[SW Message] New notification received:", notif);

        // Update UI dan count secara real-time
        this.addNotification(notif);
      }
    });
  }

  // addNotification(notification) {
  //   let notifications = [];
  //   try {
  //     notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
  //     if (!Array.isArray(notifications)) notifications = [];
  //   } catch {
  //     notifications = [];
  //   }

  //   notifications.push(notification);
  //   localStorage.setItem("notifications", JSON.stringify(notifications));

  //   let viewedIds = [];
  //   try {
  //     viewedIds = JSON.parse(localStorage.getItem("viewedStoryIds") || "[]");
  //     if (!Array.isArray(viewedIds)) viewedIds = [];
  //   } catch {
  //     viewedIds = [];
  //   }

  //   const unread = notifications.filter((n) => !viewedIds.includes(n.storyId));
  //   localStorage.setItem("unreadCount", unread.length.toString());

  //   const notifCount = this.headerElement.querySelector("#notif-count");
  //   notifCount.textContent = unread.length;
  //   notifCount.style.visibility = unread.length === 0 ? "hidden" : "visible";

  //   this.headerElement.querySelector("#notif-icon").classList.remove("hidden");

  //   console.log("[addNotification] Updated unread count:", unread.length);
  // }

  addNotification(notification) {
    let notifications = [];
    try {
      notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      if (!Array.isArray(notifications)) notifications = [];
    } catch {
      notifications = [];
    }

    // Cek duplikat: hanya push jika storyId belum ada
    const exists = notifications.some(
      (n) => n.storyId === notification.storyId
    );
    if (!exists) {
      notifications.push(notification);
      localStorage.setItem("notifications", JSON.stringify(notifications));
    } else {
      console.log(
        `[addNotification] Duplicate notification ignored, storyId: ${notification.storyId}`
      );
    }

    let viewedIds = [];
    try {
      viewedIds = JSON.parse(localStorage.getItem("viewedStoryIds") || "[]");
      if (!Array.isArray(viewedIds)) viewedIds = [];
    } catch {
      viewedIds = [];
    }

    const unread = notifications.filter((n) => !viewedIds.includes(n.storyId));
    localStorage.setItem("unreadCount", unread.length.toString());

    const notifCount = this.headerElement.querySelector("#notif-count");
    notifCount.textContent = unread.length;
    notifCount.style.visibility = unread.length === 0 ? "hidden" : "visible";

    this.headerElement.querySelector("#notif-icon").classList.remove("hidden");

    console.log("[addNotification] Updated unread count:", unread.length);
  }

  showNotificationList() {
    const notifItems = this.headerElement.querySelector("#notif-items");
    let notifications = [];
    try {
      notifications = JSON.parse(localStorage.getItem("notifications") || "[]");
      if (!Array.isArray(notifications)) notifications = [];
    } catch {
      notifications = [];
    }

    notifItems.innerHTML = notifications
      .map(
        (n) => `
          <li>
            <strong>${n.title}</strong><br/>
            <small>${n.options?.body || ""}</small>
          </li>
        `
      )
      .join("");
  }
}
