import { Route, Routes } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import ProductsPage from "../pages/ProductsPage";
import KnowledgePage from "../pages/KnowledgePage";
import QuotesPage from "../pages/QuotesPage";
import SessionsPage from "../pages/SessionsPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/quotes" element={<QuotesPage />} />
      <Route path="/sessions" element={<SessionsPage />} />
    </Routes>
  );
}