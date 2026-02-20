import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { checkoutAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { CheckCircle, Package, Loader2, Clock, MapPin, CreditCard, Phone, Mail } from 'lucide-react';
import axios from 'axios';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionId = searchParams.get('session_id');
  const orderNumberFromState = location.state?.orderNumber;
  const paymentMethodFromState = location.state?.paymentMethod;
  
  const [status, setStatus] = useState(sessionId ? 'checking' : 'success');
  const [attempts, setAttempts] = useState(0);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else if (orderNumberFromState) {
      // For cash on delivery, fetch order details
      fetchOrderDetails(orderNumberFromState);
    }
  }, [sessionId, attempts, orderNumberFromState]);

  const fetchOrderDetails = async (orderNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/orders`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const order = response.data.find(o => o.order_number === orderNumber);
      if (order) {
        setOrderDetails(order);
      }
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const checkPaymentStatus = async () => {
    try {
      const response = await checkoutAPI.getStatus(sessionId);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else if (attempts < 5) {
        setTimeout(() => setAttempts(attempts + 1), 2000);
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Failed to check payment status:', error);
      if (attempts < 5) {
        setTimeout(() => setAttempts(attempts + 1), 2000);
      } else {
        setStatus('error');
      }
    }
  };

  return (
    <div data-testid="checkout-success-page" className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Checking payment status for online payments */}
        {status === 'checking' && (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h2 data-testid="checking-payment" className="text-3xl font-bold text-gray-900 mb-3">
              Перевірка оплати...
            </h2>
            <p className="text-lg text-gray-600">
              Будь ласка, зачекайте. Ми підтверджуємо вашу оплату
            </p>
          </div>
        )}

        {/* Success for cash on delivery */}
        {status === 'success' && !sessionId && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header with celebration */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Замовлення оформлено!</h1>
              <p className="text-xl opacity-90">Дякуємо за вашу покупку</p>
            </div>

            {/* Order Details */}
            <div className="p-8 space-y-6">
              {/* Order Number */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Номер замовлення</p>
                    <p className="text-2xl font-bold text-gray-900">
                      #{orderNumberFromState || 'N/A'}
                    </p>
                  </div>
                  <Package className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              {/* Order Info Grid */}
              {orderDetails && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Дата</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(orderDetails.created_at).toLocaleDateString('uk-UA', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <p className="text-sm font-medium text-gray-600">Сума</p>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      ₴{orderDetails.total_amount?.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      Оплата при отриманні
                    </h3>
                    <p className="text-gray-700">
                      Ви зможете оплатити замовлення при отриманні товару. Підготуйте готівку або карту.
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {orderDetails?.shipping_address && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        Адреса доставки
                      </h3>
                      <p className="text-gray-700">
                        {orderDetails.shipping_address.city}, {orderDetails.shipping_address.street}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3">📋 Що далі?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Ми отримали ваше замовлення і почали його обробку</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    <span>Вам надійде email з підтвердженням замовлення</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">→</span>
                    <span>Ми зв'яжемося з вами для уточнення деталей доставки</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">→</span>
                    <span>Товар буде доставлений протягом 1-3 робочих днів</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/orders" className="w-full">
                  <Button data-testid="view-orders-button" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                    <Package className="w-5 h-5 mr-2" />
                    Мої замовлення
                  </Button>
                </Link>
                <Link to="/products" className="w-full">
                  <Button data-testid="continue-shopping-button" variant="outline" size="lg" className="w-full">
                    Продовжити покупки
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Success for online payment */}
        {status === 'success' && sessionId && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold mb-2">Оплата успішна!</h1>
              <p className="text-xl opacity-90">Дякуємо за вашу покупку</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Оплата підтверджена</h3>
                    <p className="text-gray-700">Ваше замовлення оплачено і підтверджено</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link to="/orders" className="w-full">
                  <Button size="lg" className="w-full">
                    <Package className="w-5 h-5 mr-2" />
                    Переглянути замовлення
                  </Button>
                </Link>
                <Link to="/products" className="w-full">
                  <Button variant="outline" size="lg" className="w-full">
                    Продовжити покупки
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pending payment */}
        {status === 'pending' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <Package className="w-20 h-20 mx-auto mb-6 text-yellow-500" />
            <h2 className="text-3xl font-bold text-yellow-600 mb-3">Очікується оплата</h2>
            <p className="text-lg text-gray-600 mb-6">
              Ваша оплата обробляється. Ви отримаєте email після завершення.
            </p>
            <Link to="/orders">
              <Button size="lg">
                Переглянути замовлення
              </Button>
            </Link>
          </div>
        )}

        {/* Payment error */}
        {status === 'error' && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-3xl font-bold text-red-600 mb-3">Помилка оплати</h2>
            <p className="text-lg text-gray-600 mb-6">
              Виникла проблема з перевіркою оплати. Будь ласка, зв'яжіться з підтримкою.
            </p>
            <Link to="/">
              <Button variant="outline" size="lg">
                На головну
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;