import { useState } from 'react';
import { getOrdersByUser, placeOrder } from '../services/order.service';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserOrders = async (userId) => {
    try {
      setLoading(true);
      const data = await getOrdersByUser(userId);
      setOrders(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createNewOrder = async (orderData) => {
    try {
      setLoading(true);
      const data = await placeOrder(orderData);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, fetchUserOrders, createNewOrder };
};
