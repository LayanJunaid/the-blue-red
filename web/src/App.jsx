import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <BrowserRouter>
      <AdminLayout
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode((prev) => !prev)}
      >
        <AppRoutes />
      </AdminLayout>
    </BrowserRouter>
  );
}