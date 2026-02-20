import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingBag } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [
        statsRes,
        revenueRes,
        productsRes,
        categoriesRes,
        growthRes,
        sellersRes
      ] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stats`, config),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/revenue?days=30`, config),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/top-products?limit=5`, config),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/categories`, config),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/user-growth?days=30`, config),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/sellers?limit=5`, config)
      ]);

      setStats(statsRes.data);
      setRevenueData(revenueRes.data);
      setTopProducts(productsRes.data);
      setCategoryData(categoriesRes.data);
      setUserGrowth(growthRes.data);
      setSellers(sellersRes.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Загальний дохід"
          value={`$${stats?.total_revenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Усього замовлень"
          value={stats?.total_orders || 0}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Користувачі"
          value={stats?.total_users || 0}
          icon={Users}
          trend="up"
          trendValue={`+${stats?.users_this_month || 0} цього місяця`}
          color="purple"
        />
        <StatCard
          title="Товари"
          value={stats?.total_products || 0}
          icon={Package}
          color="orange"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4">Дохід за останні 30 днів</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} name="Дохід ($)" />
            <Line type="monotone" dataKey="orders" stroke="#00C49F" strokeWidth={2} name="Замовлення" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Топ товари</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.product_id} className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">
                  #{index + 1}
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm text-gray-500">{product.total_quantity} продано</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${product.total_revenue}</p>
                  <p className="text-xs text-gray-500">{product.order_count} замовлень</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Розподіл за категоріями</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4">Зростання користувачів (30 днів)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={userGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" name="Нові користувачі" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Sellers */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold mb-4">Топ продавці</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Ранг</th>
                <th className="text-left py-3 px-4">Продавець</th>
                <th className="text-right py-3 px-4">Дохід</th>
                <th className="text-right py-3 px-4">Замовлення</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller, index) => (
                <tr key={seller.seller_id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-blue-600">#{index + 1}</span>
                  </td>
                  <td className="py-3 px-4 font-medium">{seller.name}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-600">
                    ${seller.total_revenue.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-600">{seller.total_orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
