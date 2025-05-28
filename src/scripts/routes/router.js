import routes from './routes';
import { getActiveRoute, getActivePathname } from './url-parser';

const router = async () => {
  const activeRoute = getActiveRoute();
  const pageFactory = routes[activeRoute];

  // Fallback untuk route yang tidak dikenali → redirect ke home
  if (!pageFactory) {
    location.hash = '#/';
    return;
  }

  const page = pageFactory();

  // Jika checkAuthenticatedRoute atau checkUnauthenticatedRoute mengembalikan null
  if (!page) return;

  const app = document.getElementById('main-content');
  app.innerHTML = await page.render();
  await page.afterRender?.();
};

export default router;
