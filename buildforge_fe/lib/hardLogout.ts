export const hardLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/login";
};