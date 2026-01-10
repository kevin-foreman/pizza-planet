import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage.jsx';
import MenuPage from '../pages/MenuPage.jsx';
import PizzaBuilderPage from '../pages/PizzaBuilderPage.jsx';
import SaladBuilderPage from '../pages/SaladBuilderPage.jsx';
import CalzoneBuilderPage from '../pages/CalzoneBuilderPage.jsx';
import CheckoutPage from '../pages/CheckoutPage.jsx';
import OrderStatusPage from '../pages/OrderStatusPage.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/builder/pizza" element={<PizzaBuilderPage />} />
      <Route path="/builder/salad" element={<SaladBuilderPage />} />
      <Route path="/builder/calzone" element={<CalzoneBuilderPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order/:orderId" element={<OrderStatusPage />} />
    </Routes>
  );
}

export default AppRoutes;