import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { adminAPI, categoriesAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { Users, Package, ShoppingBag, DollarSign, Plus, BarChart3, Wallet, ClipboardList, TrendingUp, Monitor, Briefcase, Gift, RotateCcw, Shield, Activity, AlertTriangle, Target, FlaskConical } from 'lucide-react';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import ProductManagement from '../components/admin/ProductManagement';
import CategoryManagement from '../components/admin/CategoryManagement';
import PayoutsDashboard from '../components/admin/PayoutsDashboard';
import OrdersAnalytics from '../components/admin/OrdersAnalytics';
import AdvancedAnalytics from '../components/admin/AdvancedAnalytics';
import SlidesManagement from '../components/admin/SlidesManagement';
import CRMDashboard from '../components/admin/CRMDashboard';
import PromotionsManagement from '../components/admin/PromotionsManagement';
import PopularCategoriesManagement from '../components/admin/PopularCategoriesManagement';
import CustomSectionsManagement from '../components/admin/CustomSectionsManagement';
import ReviewsManagement from '../components/admin/ReviewsManagement';
import ReturnsDashboard from '../components/admin/ReturnsDashboard';
import PolicyDashboard from '../components/admin/PolicyDashboard';
import PaymentHealthDashboard from '../components/admin/PaymentHealthDashboard';
import RiskCenter from '../components/admin/RiskCenter';
import RevenueControl from '../components/admin/RevenueControl';
import ABTests from '../components/admin/ABTests';

const AdminPanel = () => {
  const { isAdmin, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, loading, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, categoriesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        categoriesAPI.getAll()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await categoriesAPI.create(categoryForm);
      toast.success('Категорію додано!');
      setShowAddCategory(false);
      setCategoryForm({ name: '', slug: '' });
      fetchData();
    } catch (error) {
      toast.error('Помилка додавання категорії');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <div className="absolute top-0 left-0 animate-ping rounded-full h-20 w-20 border-4 border-purple-400 opacity-20"></div>
          </div>
          <p className="text-gray-600 text-xl font-semibold">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div data-testid="admin-panel" className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 md:py-12">
      <div className="container-main px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-12 gap-6 animate-slideInLeft">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🎯 Адмін Панель
            </h1>
            <p className="text-gray-600 text-lg">Керування маркетплейсом Y-store</p>
          </div>
          <Button 
            onClick={() => setShowAddCategory(!showAddCategory)} 
            className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            <span className="hidden md:inline">Додати категорію</span>
            <span className="md:hidden">Категорія</span>
          </Button>
        </div>

        {/* Tabs - Horizontal scroll on mobile */}
        <div className="mb-8 md:mb-12 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-max pb-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
              }`}
            >
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Аналітика</span>
              <span className="sm:hidden">📊</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
              }`}
            >
              <Users className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Користувачі</span>
              <span className="sm:hidden">👥</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
                activeTab === 'categories'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
              }`}
            >
              <Package className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Категорії</span>
              <span className="sm:hidden">📦</span>
            </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'products'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Товари</span>
            <span className="sm:hidden">🛍️</span>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Wallet className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Виплати</span>
            <span className="sm:hidden">💰</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <ClipboardList className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Замовлення</span>
            <span className="sm:hidden">📋</span>
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'advanced'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Розширена</span>
            <span className="sm:hidden">📈</span>
          </button>
          <button
            onClick={() => setActiveTab('slides')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'slides'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Monitor className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Слайдер</span>
            <span className="sm:hidden">🖼️</span>
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'crm'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Briefcase className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">CRM</span>
            <span className="sm:hidden">💼</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'promotions'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Gift className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Акції</span>
            <span className="sm:hidden">🎁</span>
          </button>
          <button
            onClick={() => setActiveTab('popular-categories')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'popular-categories'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Package className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Популярні категорії</span>
            <span className="sm:hidden">📦</span>
          </button>
          <button
            onClick={() => setActiveTab('custom-sections')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'custom-sections'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Кастомні розділи</span>
            <span className="sm:hidden">🔥</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Monitor className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Відгуки</span>
            <span className="sm:hidden">⭐</span>
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'returns'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Повернення</span>
            <span className="sm:hidden">↩️</span>
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'policy'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Shield className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Policy</span>
            <span className="sm:hidden">🛡️</span>
          </button>
          <button
            onClick={() => setActiveTab('payment-health')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'payment-health'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Activity className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Payment Health</span>
            <span className="sm:hidden">💳</span>
          </button>
          <button
            onClick={() => setActiveTab('risk-center')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'risk-center'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Risk Center</span>
            <span className="sm:hidden">⚠️</span>
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'revenue'
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <Target className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Revenue</span>
            <span className="sm:hidden">🎯</span>
          </button>
          <button
            onClick={() => setActiveTab('ab-tests')}
            className={`px-5 py-3 font-bold rounded-2xl transition-all duration-300 whitespace-nowrap text-sm md:text-base flex items-center gap-2 ${
              activeTab === 'ab-tests'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 shadow-md'
            }`}
          >
            <FlaskConical className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">A/B Tests</span>
            <span className="sm:hidden">🧪</span>
          </button>
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AnalyticsDashboard />}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && <PayoutsDashboard />}

        {/* Orders Tab */}
        {activeTab === 'orders' && <OrdersAnalytics />}

        {/* Advanced Analytics Tab */}
        {activeTab === 'advanced' && <AdvancedAnalytics />}

        {/* Slides Management Tab */}
        {activeTab === 'slides' && <SlidesManagement />}

        {/* CRM Tab */}
        {activeTab === 'crm' && <CRMDashboard />}

        {/* Promotions Tab */}
        {activeTab === 'promotions' && <PromotionsManagement />}

        {/* Popular Categories Tab */}
        {activeTab === 'popular-categories' && <PopularCategoriesManagement />}

        {/* Custom Sections Tab */}
        {activeTab === 'custom-sections' && <CustomSectionsManagement />}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && <ReviewsManagement />}

        {/* Returns Tab (O20.4) */}
        {activeTab === 'returns' && <ReturnsDashboard />}

        {/* Policy Tab (O20.5 & O20.6) */}
        {activeTab === 'policy' && <PolicyDashboard />}

        {/* Payment Health Dashboard */}
        {activeTab === 'payment-health' && <PaymentHealthDashboard />}

        {/* Risk Center */}
        {activeTab === 'risk-center' && <RiskCenter />}

        {/* Revenue Optimization Engine */}
        {activeTab === 'revenue' && <RevenueControl />}

        {/* A/B Tests */}
        {activeTab === 'ab-tests' && <ABTests />}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Список користувачів</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Ім'я</th>
                    <th className="text-left py-3 px-4">Роль</th>
                    <th className="text-left py-3 px-4">Дата реєстрації</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.full_name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.role === 'admin' ? 'bg-red-100 text-red-600' :
                          user.role === 'seller' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && <CategoryManagement />}

        {/* Products Tab */}
        {activeTab === 'products' && <ProductManagement />}
      </div>
    </div>
  );
};

export default AdminPanel;