// 🌙 Gestion avancée du thème
function applyTheme() {
  let theme = localStorage.getItem("theme");

  if (theme === "dark" || theme === "light") {
    document.body.classList.toggle("dark", theme === "dark");
    return;
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add("dark");
    return;
  }

  const hour = new Date().getHours();
  if (hour >= 20 || hour < 7) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
}

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener("change", applyTheme);
}

applyTheme();
