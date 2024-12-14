import React from 'react';
import { Cart } from '../components/Cart/Cart';
import { Helmet } from 'react-helmet-async';

export default function CartPage() {
  return (
    <>
      <Helmet>
        <title>Shopping Cart - Flaskify</title>
      </Helmet>
      <Cart />
    </>
  );
} 