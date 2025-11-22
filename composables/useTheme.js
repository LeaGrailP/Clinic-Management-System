import { ref, onMounted } from "vue";

const isDark = ref(false);

export function useTheme() {
  const toggleTheme = () => {
    isDark.value = !isDark.value;
    document.documentElement.classList.toggle("dark", isDark.value);
    localStorage.setItem("theme", isDark.value ? "dark" : "light");
  };

  onMounted(() => {
    const saved = localStorage.getItem("theme");
    isDark.value = saved === "dark";
    if (isDark.value) {
      document.documentElement.classList.add("dark");
    }
  });

  return { isDark, toggleTheme };
}