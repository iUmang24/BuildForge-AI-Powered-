export const adminhardLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/admin/login";
};