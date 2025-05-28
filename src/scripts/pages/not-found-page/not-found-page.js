import NotFoundPresenter from './not-found-presenter';

export default class NotFoundPage {
  constructor() {
    this.presenter = new NotFoundPresenter(this);
  }

  async render() {
    return `
      <section class="not-found">
        <h1>404 - Halaman Tidak Ditemukan</h1>
        <p>Alamat yang Anda tuju tidak tersedia.</p>
        <a href="#/">Kembali ke Beranda</a>
      </section>
    `;
  }

  async afterRender() {
    // Tambahkan logika jika perlu
  }
}
