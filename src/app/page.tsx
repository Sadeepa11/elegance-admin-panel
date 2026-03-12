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

import { useTheme } from '@/context/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
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
          getDocs(collectionUnfiltered(db, 'products')),
          getDocs(collectionUnfiltered(db, 'categories')),
          getDocs(collectionUnfiltered(db, 'users')),
          getDocs(collectionGroup(db, 'orders'))
        ]);

        function collectionUnfiltered(db: any, path: string) {
            return collection(db, path);
        }

        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        const orders = ordersSnap.docs.map(doc => doc.data() as any);

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

        const last7Days = [...Array(7)].map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailySales = last7Days.map(date => {
          const dayTotal = orders
            .filter(o => {
                try {
                    const orderDate = o.timestamp?.toDate ? o.timestamp.toDate() : new Date(o.timestamp);
                    return orderDate.toISOString().split('T')[0] === date && o.status !== 'Cancelled';
                } catch (e) {
                    return false;
                }
            })
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
          return { date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), sales: dayTotal };
        });
        setChartData(dailySales);

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
    { name: 'Portfolio Value', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Service Requests', value: stats.orders, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Asset Inventory', value: stats.products, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { name: 'Active Personnel', value: stats.users, icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 bg-primary rounded-full animate-pulse"></div>
            </div>
        </div>
        <p className="text-muted-foreground font-bold tracking-widest uppercase text-[10px] animate-pulse">Initializing Dashboard...</p>
      </div>
    );
  }

  const chartColor = theme === 'dark' ? '#ff5fb1' : '#d4145a';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-1000">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Operations Overview</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">System Intelligence</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Real-time analytical insights and administrative control center.</p>
        </div>
        <div className="flex items-center space-x-3">
             <div className="px-4 py-2 glass-panel rounded-2xl text-[10px] font-bold tracking-widest text-foreground uppercase border-white/5 shadow-sm">
                Last Sync: {new Date().toLocaleTimeString()}
             </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="glass-panel p-8 rounded-[2.5rem] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden isolate">
            <div className={`absolute top-0 right-0 -z-10 w-24 h-24 ${stat.bg} blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
            <div className="flex items-center justify-between mb-6">
              <div className={`p-4 rounded-2xl ${stat.bg} ring-4 ring-white/5 transition-transform group-hover:scale-110 duration-500`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">{stat.name}</p>
              <h3 className="text-3xl font-black text-foreground mt-2 tracking-tighter">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Sales Chart */}
        <div className="lg:col-span-2 glass-panel p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-primary/5 blur-[100px] rounded-full"></div>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter">Revenue Trajectory</h3>
              <p className="text-sm text-muted-foreground font-medium">Performance analytics over the preceding 7-day cycle</p>
            </div>
            <Link href="/orders" className="p-3 bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-2xl transition-all duration-300">
                <TrendingUp className="w-5 h-5" />
            </Link>
          </div>
          <div className="h-80 w-full animate-in fade-in duration-1000 delay-300">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                  dy={20}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(value) => `LKR ${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--card)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    padding: '16px 24px'
                  }}
                  itemStyle={{ fontWeight: 800, color: 'var(--foreground)' }}
                  labelStyle={{ marginBottom: '8px', color: 'var(--muted-foreground)', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase' }}
                  formatter={(value: any) => [`LKR ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke={chartColor}
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Restock Alerts */}
        <div className="glass-panel p-10 rounded-[3rem] border-white/5 shadow-sm overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 -z-10 w-48 h-48 bg-red-500/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-black text-foreground tracking-tighter flex items-center">
                Critical Alerts
              </h3>
              <p className="text-sm text-muted-foreground font-medium">Assets requiring immediate replenishment</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="space-y-4 flex-1">
            {restockAlerts.length > 0 ? restockAlerts.map(product => (
              <div key={product.id} className="group flex items-center justify-between p-4 rounded-3xl bg-white/5 hover:bg-red-500/5 border border-white/5 hover:border-red-500/10 transition-all duration-300">
                <div className="flex items-center space-x-4">
                  {product.imageUrl && (
                    <div className="relative">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-2xl object-cover shadow-2xl transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></div>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground truncate w-28 tracking-tight">{product.name}</p>
                    <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">{product.count} stock units</p>
                  </div>
                </div>
                <Link href={`/products/edit/${product.id}`} className="p-3 bg-white/5 text-muted-foreground hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center flex-1 py-10">
                <Tag className="w-16 h-16 text-muted/30 mb-4" />
                <p className="text-sm text-muted-foreground font-bold tracking-widest uppercase">Inventory Level Nominal</p>
              </div>
            )}
          </div>
          <Link href="/products" className="mt-8 block w-full text-center py-4 rounded-2xl bg-muted hover:bg-primary hover:text-white text-xs font-bold tracking-widest uppercase transition-all duration-300">
            Audit Full Inventory
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Best Sellers */}
        <div className="glass-panel p-10 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 -z-10 w-48 h-48 bg-blue-500/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center justify-between mb-10">
            <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter flex items-center">
                    Top Performers
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Leading assets by deployment volume</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="space-y-6">
            {bestSellers.map((product, idx) => (
              <div key={product.id} className="group flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <span className="text-xs font-black text-muted-foreground/30 w-4">{idx + 1}</span>
                  <div className="relative">
                    <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-2xl object-cover shadow-xl group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{product.count} Successful Cycles</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-foreground/40">{Math.round((product.count / (bestSellers[0].count || 1)) * 100)}%</span>
                    <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full animate-in slide-in-from-left duration-1000"
                            style={{ width: `${(product.count / (bestSellers[0].count || 1)) * 100}%` }}
                        />
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Engaging */}
        <div className="glass-panel p-10 rounded-[3rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 -z-10 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full"></div>
          <div className="flex items-center justify-between mb-10">
            <div>
                <h3 className="text-2xl font-black text-foreground tracking-tighter flex items-center">
                    Social Intelligence
                </h3>
                <p className="text-sm text-muted-foreground font-medium">Assets with highest distinct operator engagement</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="space-y-6">
            {engagingProducts.map((product, idx) => (
              <div key={product.id} className="group flex items-center justify-between">
                <div className="flex items-center space-x-5">
                  <span className="text-xs font-black text-muted-foreground/30 w-4">{idx + 1}</span>
                  <div className="relative">
                    <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-2xl object-cover shadow-xl group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl"></div>
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground tracking-tight">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">{product.count} Unique Operators</p>
                  </div>
                </div>
                <div className="flex -space-x-3">
                  {[...Array(Math.min(product.count, 3))].map((_, i) => (
                    <div key={i} className="w-9 h-9 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden shadow-lg transition-transform group-hover:-translate-y-1 duration-300" style={{ transitionDelay: `${i * 100}ms` }}>
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                  {product.count > 3 && (
                    <div className="w-9 h-9 rounded-full border-4 border-card bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary backdrop-blur-md shadow-lg transition-transform group-hover:-translate-y-1 duration-300" style={{ transitionDelay: '300ms' }}>
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
