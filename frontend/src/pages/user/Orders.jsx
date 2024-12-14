import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get('/api/orders', {
                withCredentials: true
            });
            setOrders(response.data.orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'shipped':
                return 'bg-blue-100 text-blue-800';
            case 'delivered':
                return 'bg-purple-100 text-purple-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">My Orders</h1>

            {orders.length === 0 ? (
                <div className="text-center py-12">
                    <h2 className="text-xl text-gray-600">You haven't placed any orders yet.</h2>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order.order_uuid} className="bg-white rounded-lg shadow overflow-hidden">
                            {/* Order Header */}
                            <div className="p-6 border-b">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-semibold">Order #{order.order_uuid.slice(0, 8)}</h2>
                                        <p className="text-gray-600">
                                            Placed on {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                        <span className="text-lg font-semibold mt-2">
                                            ${parseFloat(order.total).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="p-6">
                                <div className="space-y-4">
                                    {order.items.map((item) => (
                                        <div key={item.item_uuid} className="flex items-center space-x-4">
                                            <img
                                                src={item.product.main_image}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-medium">{item.product.name}</h3>
                                                <p className="text-gray-600">
                                                    Quantity: {item.quantity} × ${parseFloat(item.unit_price).toFixed(2)}
                                                </p>
                                                {item.selected_option && (
                                                    <p className="text-gray-600">
                                                        Variation: {item.selected_option.name} - {item.selected_option.value}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">
                                                    ${parseFloat(item.subtotal).toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary */}
                                <div className="mt-6 border-t pt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal</span>
                                            <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span>${parseFloat(order.shipping_fee).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-lg">
                                            <span>Total</span>
                                            <span>${parseFloat(order.total).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Information */}
                                <div className="mt-6 border-t pt-4">
                                    <h3 className="font-semibold mb-2">Shipping Information</h3>
                                    <div className="text-gray-600">
                                        <p>{order.shipping_address.recipient_name}</p>
                                        <p>{order.shipping_address.phone_number}</p>
                                        <p>{order.shipping_address.address_line1}</p>
                                        {order.shipping_address.address_line2 && (
                                            <p>{order.shipping_address.address_line2}</p>
                                        )}
                                        <p>
                                            {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                                        </p>
                                        <p>{order.shipping_address.country}</p>
                                    </div>
                                    {order.tracking_number && (
                                        <div className="mt-2">
                                            <p className="font-medium">Tracking Number:</p>
                                            <p className="text-blue-600">{order.tracking_number}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders; 