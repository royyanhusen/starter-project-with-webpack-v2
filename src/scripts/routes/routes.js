import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login/login-page";
import RegisterPage from "../pages/auth/register/register-page";
import StoryDetailPage from "../pages/stories-detail/stories-detail-page";
import NewStoryPage from "../pages/new-story/new-story-page";
import NewStoryGuestPage from "../pages/new-story-guest/new-story-guest-page";
import BookmarkPage from "../pages/bookmark/bookmark-page";
import {
  checkUnauthenticatedRouteOnly,
  checkAuthenticatedRoute,
} from "../utils/auth";
import NotFoundPage from "../pages/not-found-page/not-found-page.js";

const routes = {
  "/login": () => checkUnauthenticatedRouteOnly(new LoginPage()),
  "/register": () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  "/": () => checkAuthenticatedRoute(new HomePage()),
  "/story-detail/:id": () => checkAuthenticatedRoute(new StoryDetailPage()),
  "/new-story": () => checkAuthenticatedRoute(new NewStoryPage()),
  "/new-guest-story": () => new NewStoryGuestPage(),
  "/bookmark": () => checkAuthenticatedRoute(new BookmarkPage()),

  "*": () => new NotFoundPage(), // handle semua rute yang tidak dikenali
};

export default routes;
