/**
 * O19: Analytics Dashboard Component
 * KPI Overview, Revenue Chart, Funnel, SLA
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  ShoppingCart, AlertTriangle, Clock, RefreshCw,
  BarChart2, PieChart
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import analyticsService from '../../services/analyticsService';

const AnalyticsDashboard = () => {
  const [range, setRange] = useState(7);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [riskDist, setRiskDist] = useState({});

  // Українські переклади
  const t = {
    title: 'Аналітика',
    revenue: 'Виручка',
    orders: 'Замовлення',
    aov: 'Середній чек',
    delivered: 'Доставлено',
    revenueTrend: 'Динаміка виручки',
    ordersByDay: 'Замовлення по днях',
    orderFunnel: 'Воронка замовлень',
    riskDistribution: 'Розподіл ризиків',
    deliverySLA: 'SLA доставки (години)',
    average: 'Середнє',
    median: 'Медіана',
    paid: 'Оплачено',
    awaitingPayment: 'Очікує оплати',
    processing: 'В обробці',
    shipped: 'Відправлено',
    cancelled: 'Скасовано',
    returned: 'Повернення',
    days: 'днів',
    refresh: 'Оновити',
    loading: 'Завантаження...',
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiData, riskData] = await Promise.all([
        analyticsService.getOpsKPI(range),
        analyticsService.getRiskDistribution()
      ]);
      setKpi(kpiData);
      setRiskDist(riskData.distribution || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const KPICard = ({ title, value, icon: Icon, color = 'blue', trend = null }) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
          {trend !== null && (
            <div className={`flex items-center mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="text-xs ml-1">{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const FunnelItem = ({ label, value, color }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-3 ${color}`}></div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <AlertTriangle className="inline mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="analytics-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
        <div className="flex items-center gap-4">
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            data-testid="range-selector"
          >
            <option value={7}>7 {t.days}</option>
            <option value={14}>14 {t.days}</option>
            <option value={30}>30 {t.days}</option>
            <option value={90}>90 {t.days}</option>
          </select>
          <button
            onClick={loadData}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title={t.revenue}
          value={formatCurrency(kpi?.revenue)} 
          icon={DollarSign} 
          color="green"
        />
        <KPICard 
          title={t.orders}
          value={kpi?.orders || 0} 
          icon={ShoppingCart} 
          color="blue"
        />
        <KPICard 
          title={t.aov}
          value={formatCurrency(kpi?.aov)} 
          icon={BarChart2} 
          color="purple"
        />
        <KPICard 
          title={t.delivered}
          value={kpi?.delivered || 0} 
          icon={Package} 
          color="teal"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{t.revenueTrend}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpi?.by_day || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} tickFormatter={(v) => v?.slice(5)} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), t.revenue]}
                  labelFormatter={(label) => `Дата: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{t.ordersByDay}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpi?.by_day || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} tickFormatter={(v) => v?.slice(5)} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funnel & Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Funnel */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{t.orderFunnel}</h3>
          <div className="divide-y divide-gray-100">
            <FunnelItem label={t.paid} value={kpi?.paid || 0} color="bg-green-500" />
            <FunnelItem label={t.awaitingPayment} value={kpi?.awaiting_payment || 0} color="bg-yellow-500" />
            <FunnelItem label={t.processing} value={kpi?.processing || 0} color="bg-blue-500" />
            <FunnelItem label={t.shipped} value={kpi?.shipped || 0} color="bg-purple-500" />
            <FunnelItem label={t.delivered} value={kpi?.delivered || 0} color="bg-teal-500" />
            <FunnelItem label={t.cancelled} value={kpi?.cancels || 0} color="bg-red-500" />
            <FunnelItem label={t.returned} value={kpi?.returns || 0} color="bg-orange-500" />
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">{t.riskDistribution}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-green-500 mr-3"></div>
                <span>Низький</span>
              </div>
              <span className="font-bold">{riskDist.LOW || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-yellow-500 mr-3"></div>
                <span>Середній</span>
              </div>
              <span className="font-bold">{riskDist.WATCH || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded bg-red-500 mr-3"></div>
                <span>Високий</span>
              </div>
              <span className="font-bold">{riskDist.RISK || 0}</span>
            </div>
          </div>
          
          {/* SLA */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 mb-3">{t.deliverySLA}</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{(kpi?.sla?.avg_h || 0).toFixed(1)}</p>
                <p className="text-xs text-gray-500">{t.average}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{(kpi?.sla?.median_h || 0).toFixed(1)}</p>
                <p className="text-xs text-gray-500">{t.median}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{(kpi?.sla?.p95_h || 0).toFixed(1)}</p>
                <p className="text-xs text-gray-500">P95</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
