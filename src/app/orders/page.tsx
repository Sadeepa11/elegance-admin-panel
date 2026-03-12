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
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'Cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'Processing':
            default:
                return 'bg-primary/10 text-primary border-primary/20';
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                </div>
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Fulfillment Engine</span>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter">Order Management</h1>
                    <p className="text-muted-foreground text-sm font-medium mt-1">Real-time status tracking and administrative control.</p>
                </div>
                <div className="flex items-center space-x-3">
                     <div className="px-5 py-3 glass-panel rounded-2xl flex items-center shadow-sm">
                        <Package className="w-4 h-4 text-primary mr-3" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-3">Total Cycles:</span>
                        <span className="text-lg font-black text-foreground">{orders.length}</span>
                     </div>
                </div>
            </div>

            <div className="premium-card relative overflow-visible">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                            <tr>
                                <th scope="col" className="w-14 px-6 py-5"></th>
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date / Time</th>
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction ID</th>
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Personnel / Delivery</th>
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue</th>
                                <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Classification</th>
                                <th scope="col" className="px-6 py-5 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Administrative</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                                                <Package className="h-10 w-10 text-muted-foreground opacity-30" />
                                            </div>
                                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No Active Records Found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <React.Fragment key={order.orderId}>
                                    <tr
                                        className={`hover:bg-primary/5 transition-all duration-300 group ${expandedRows.has(order.orderId) ? 'bg-primary/[0.02]' : ''}`}
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleRow(order.orderId)}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 shadow-sm"
                                            >
                                                {expandedRows.has(order.orderId) ?
                                                    <ChevronDown className="h-4 w-4" /> :
                                                    <ChevronRight className="h-4 w-4" />
                                                }
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-black text-foreground tracking-tight">
                                                {new Date(order.timestamp).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1 opacity-60">
                                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="px-3 py-1.5 rounded-xl bg-muted/50 text-[11px] font-black text-foreground border border-border inline-block tracking-widest uppercase">
                                                #{order.orderId.substring(0, 8)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 max-w-xs">
                                            <div className="text-sm font-black text-foreground truncate tracking-tight" title={order.userId}>
                                                ID: {order.userId.substring(0, 12)}
                                            </div>
                                            <div className="text-[10px] font-medium text-muted-foreground mt-1 truncate opacity-80" title={order.shippingAddress}>
                                                {order.shippingAddress || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-black text-foreground tracking-tighter">
                                                LKR {order.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
                                                {order.items?.length || 0} Assets • {order.paymentMethod}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-500 shadow-sm ${getStatusStyles(order.status || 'Processing')}`}>
                                                {getStatusIcon(order.status || 'Processing')}
                                                {order.status || 'Processing'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                                            <select
                                                value={order.status || 'Processing'}
                                                onChange={(e) => order.parentPath && updateOrderStatus(order.parentPath, e.target.value, order.orderId, order.userId)}
                                                disabled={updatingParams === order.parentPath}
                                                className="inline-block w-36 px-4 py-2 bg-muted text-[11px] font-black uppercase tracking-widest text-foreground rounded-2xl border-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:bg-muted/80"
                                            >
                                                <option value="Processing">Processing</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                    </tr>

                                    {/* Expanded Details Row */}
                                    {expandedRows.has(order.orderId) && (
                                        <tr className="bg-muted/10 animate-in slide-in-from-top-2 duration-300">
                                            <td colSpan={7} className="px-10 py-8 border-t border-border">
                                                <div className="relative">
                                                    <div className="absolute left-[-2rem] top-0 bottom-0 w-1 bg-primary/20 rounded-full"></div>
                                                    <h4 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center">
                                                        <Package className="w-4 h-4 mr-3 text-primary" />
                                                        Asset Requisition Deployment List
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {order.items?.map((item, index) => (
                                                            <div key={index} className="flex items-center glass-panel p-5 rounded-[2rem] border-white/5 shadow-xl hover:scale-[1.02] transition-transform duration-300">
                                                                <div className="relative">
                                                                    <Image
                                                                        src={item.imageUrl}
                                                                        alt={item.name}
                                                                        width={80}
                                                                        height={80}
                                                                        className="w-20 h-20 object-cover rounded-2xl shadow-2xl transition-transform"
                                                                        onError={(e) => { (e.target as HTMLImageElement).src = '/fallback.png' }}
                                                                        unoptimized
                                                                    />
                                                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                                                                </div>
                                                                <div className="ml-5 flex-1 min-w-0">
                                                                    <p className="text-sm font-black text-foreground truncate tracking-tight mb-1">
                                                                        {item.name}
                                                                    </p>
                                                                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest gap-2">
                                                                        <span className="text-primary">x{item.quantity}</span>
                                                                        <span>•</span>
                                                                        <span>LKR {item.price.toLocaleString()}</span>
                                                                    </div>
                                                                    {(item.size || item.color) && (
                                                                        <div className="flex mt-3 gap-2">
                                                                            {item.size && item.size !== 'Default' && (
                                                                                <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black text-foreground/60 uppercase">
                                                                                    {item.size}
                                                                                </span>
                                                                            )}
                                                                            {item.color && item.color !== 'Default' && (
                                                                                <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-black text-foreground/60 uppercase">
                                                                                    {item.color}
                                                                                </span>
                                                                            )}
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
