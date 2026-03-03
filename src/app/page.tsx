'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package, Users, Tag, TrendingUp, AlertCircle, ShoppingBag, Star, ArrowRight } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import Link from 'next/link';

interface DashboardStats {
  products: number;
  categories: number;
  users: number;
  orders: number;
  totalRevenue: number;
}

interface ChartData {
  date: string;
  sales: number;
}

interface ProductInsight {
  id: string;
  name: string;
  count: number;
  imageUrl?: string;
  stock?: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    products: 0,
    categories: 0,
    users: 0,
    orders: 0,
    totalRevenue: 0
  });

  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [bestSellers, setBestSellers] = useState<ProductInsight[]>([]);
  const [restockAlerts, setRestockAlerts] = useState<ProductInsight[]>([]);
  const [engagingProducts, setEngagingProducts] = useState<ProductInsight[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [productsSnap, categoriesSnap, usersSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'users')),
          getDocs(collectionGroup(db, 'orders'))
        ]);

        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const orders = ordersSnap.docs.map(doc => doc.data() as any);

        // Basic Stats
        let revenue = 0;
        orders.forEach(o => {
          if (o.status !== 'Cancelled') {
            revenue += o.totalAmount || 0;
          }
        });

        setStats({
          products: productsSnap.size,
          categories: categoriesSnap.size,
          users: usersSnap.size,
          orders: ordersSnap.size,
          totalRevenue: revenue
        });

        // Chart Data (Last 7 days)
        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailySales = last7Days.map(date => {
          const dayTotal = orders
            .filter(o => new Date(o.timestamp).toISOString().split('T')[0] === date && o.status !== 'Cancelled')
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), sales: dayTotal };
        });
        setChartData(dailySales);

        // Best Sellers & Engaging Logic
        const productStats: Record<string, { count: number, users: Set<string>, name: string, imageUrl: string }> = {};

        orders.forEach(order => {
          order.items?.forEach((item: any) => {
            if (!productStats[item.productId]) {
              productStats[item.productId] = { count: 0, users: new Set(), name: item.name, imageUrl: item.imageUrl };
            }
            productStats[item.productId].count += item.quantity;
            productStats[item.productId].users.add(order.userId);
          });
        });

        const sortedBestSellers = Object.entries(productStats)
          .map(([id, data]) => ({ id, name: data.name, count: data.count, imageUrl: data.imageUrl }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setBestSellers(sortedBestSellers);

        const sortedEngaging = Object.entries(productStats)
          .map(([id, data]) => ({ id, name: data.name, count: data.users.size, imageUrl: data.imageUrl }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setEngagingProducts(sortedEngaging);

        // Restock Alerts
        const lowStock = products
          .filter(p => p.stock <= 10)
          .map(p => ({ id: p.id, name: p.name, count: p.stock, imageUrl: p.imageUrl }))
          .sort((a, b) => a.count - b.count)
          .slice(0, 5);

        setRestockAlerts(lowStock);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    { name: 'Total Revenue', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Products', value: stats.products, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Active Users', value: stats.users, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Sales Overview</h3>
              <p className="text-sm text-gray-500">Revenue trend over the last 7 days</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `LKR ${value}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Restock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                Inventory Alerts
              </h3>
              <p className="text-sm text-gray-500">Products needing immediate restock</p>
            </div>
          </div>
          <div className="space-y-4">
            {restockAlerts.length > 0 ? restockAlerts.map(product => (
              <div key={product.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center space-x-3">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover shadow-sm" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate w-32">{product.name}</p>
                    <p className="text-xs text-red-600 font-medium">{product.count} items left</p>
                  </div>
                </div>
                <Link href={`/products/edit/${product.id}`} className="p-2 bg-white rounded-lg shadow-sm border border-red-200 hover:bg-red-100 transition-colors">
                  <ArrowRight className="w-4 h-4 text-red-600" />
                </Link>
              </div>
            )) : (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-500">All stock levels are healthy</p>
              </div>
            )}
          </div>
          <Link href="/products" className="mt-6 block w-full text-center py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            View All Inventory
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Best Sellers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <ShoppingBag className="w-5 h-5 text-blue-500 mr-2" />
            Best Selling Products
          </h3>
          <div className="space-y-4">
            {bestSellers.map((product, idx) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                  <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.count} sales</p>
                  </div>
                </div>
                <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(product.count / bestSellers[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Engaging */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Star className="w-5 h-5 text-orange-500 mr-2" />
            Most Engaging Products
          </h3>
          <div className="space-y-4">
            {engagingProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-bold text-gray-400 w-4">{idx + 1}</span>
                  <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">Ordered by {product.count} unique users</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {[...Array(Math.min(product.count, 3))].map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                      <Users className="w-3 h-3 text-gray-400" />
                    </div>
                  ))}
                  {product.count > 3 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                      +{product.count - 3}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
