'use client';

import React, { useState, useEffect } from 'react';
import { collectionGroup, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChevronDown, ChevronRight, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
    imageUrl: string;
}

interface Order {
    orderId: string;
    userId: string;
    timestamp: number;
    status: string;
    totalAmount: number;
    shippingAddress: string;
    paymentMethod: string;
    items: CartItem[];
    // We add this specific metadata locally iterating through the collectionGroup arrays
    parentPath?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [updatingParams, setUpdatingParams] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            // Because orders exist natively inside 'users/{uid}/orders', we leverage collectionGroup globally
            // Removed server-side orderBy to bypass the COLLECTION_GROUP_DESC index requirement
            const ordersQuery = query(collectionGroup(db, 'orders'));
            const querySnapshot = await getDocs(ordersQuery);

            const ordersData = querySnapshot.docs.map(doc => {
                const data = doc.data() as Order;
                return {
                    ...data,
                    parentPath: doc.ref.path // Record specific DocumentRef path bridging explicit status updates later
                };
            });

            // Sort orders locally by timestamp (descending) to avoid the need for a composite index
            ordersData.sort((a, b) => b.timestamp - a.timestamp);

            setOrders(ordersData);
        } catch (error) {
            console.error("Error fetching generic orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (orderId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedRows(newExpanded);
    };

    const updateOrderStatus = async (orderPath: string, newStatus: string, orderId: string, userId: string) => {
        try {
            setUpdatingParams(orderPath);
            const orderRef = doc(db, orderPath);
            await updateDoc(orderRef, { status: newStatus });

            // Send notification
            try {
                const response = await fetch('/api/notifications/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, orderId, status: newStatus }),
                });
                const result = await response.json();
                if (!result.success) {
                    console.warn("Notification not sent:", result.message);
                }
            } catch (notifError) {
                console.error("Failed to send notification:", notifError);
            }

            // Refresh explicitly mapping current states
            setOrders(orders.map(order =>
                order.parentPath === orderPath ? { ...order, status: newStatus } : order
            ));
        } catch (error) {
            console.error("Failed executing order status modification:", error);
            alert("Failed updating order status.");
        } finally {
            setUpdatingParams(null);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'Completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Cancelled':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'Processing':
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed':
                return <CheckCircle className="w-4 h-4 mr-1.5" />;
            case 'Cancelled':
                return <XCircle className="w-4 h-4 mr-1.5" />;
            case 'Processing':
            default:
                return <Clock className="w-4 h-4 mr-1.5" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border">
                    Total Orders: <span className="font-bold text-gray-900">{orders.length}</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="w-10 px-6 py-4"></th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Info</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                                        <Package className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        No orders found matching the global scope.
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <React.Fragment key={order.orderId}>
                                    {/* Primary Row */}
                                    <tr
                                        className={`hover:bg-gray-50 transition-colors ${expandedRows.has(order.orderId) ? 'bg-gray-50' : ''}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleRow(order.orderId)}
                                                className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                            >
                                                {expandedRows.has(order.orderId) ?
                                                    <ChevronDown className="h-5 w-5" /> :
                                                    <ChevronRight className="h-5 w-5" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                                #{order.orderId.substring(0, 8)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={order.userId}>
                                                User: {order.userId.substring(0, 8)}...
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={order.shippingAddress}>
                                                {order.shippingAddress || "No address provided"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">
                                                LKR {order.totalAmount?.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {order.items?.length || 0} items • {order.paymentMethod}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyles(order.status || 'Processing')}`}>
                                                {getStatusIcon(order.status || 'Processing')}
                                                {order.status || 'Processing'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <select
                                                value={order.status || 'Processing'}
                                                onChange={(e) => order.parentPath && updateOrderStatus(order.parentPath, e.target.value, order.orderId, order.userId)}
                                                disabled={updatingParams === order.parentPath}
                                                className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 disabled:opacity-50"
                                            >
                                                <option value="Processing">Processing</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>

                                    {/* Expanded Cart Details Row */}
                                    {expandedRows.has(order.orderId) && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={7} className="px-6 py-4 border-t border-gray-100 pb-8">
                                                <div className="ml-10">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                                        <Package className="w-4 h-4 mr-2" />
                                                        Purchased Items List
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {order.items?.map((item, index) => (
                                                            <div key={index} className="flex items-center bg-white p-3 rounded-lg border shadow-sm">
                                                                <Image
                                                                    src={item.imageUrl}
                                                                    alt={item.name}
                                                                    width={64}
                                                                    height={64}
                                                                    className="w-16 h-16 object-cover rounded-md border"
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = '/fallback.png' }}
                                                                    unoptimized
                                                                />
                                                                <div className="ml-3 flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {item.name}
                                                                    </p>
                                                                    <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                                                                        <span className="font-semibold text-gray-900">x{item.quantity}</span>
                                                                        <span>•</span>
                                                                        <span>LKR {item.price.toFixed(2)}</span>
                                                                    </div>
                                                                    {(item.size || item.color) && (
                                                                        <div className="flex mt-1 text-xs text-gray-500">
                                                                            {item.size && item.size !== 'Default' ? `Size: ${item.size}` : ''}
                                                                            {item.size && item.color && item.size !== 'Default' && item.color !== 'Default' ? ' | ' : ''}
                                                                            {item.color && item.color !== 'Default' ? `Color: ${item.color}` : ''}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
