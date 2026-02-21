import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { productsAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { MapPin, CreditCard, Building2, User, Phone, Mail, ChevronRight, AlertCircle, Package, Truck, Home, Settings, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import NovaPoshtaDelivery from '../components/NovaPoshtaDelivery';
import { trackCheckoutStart, trackOrderCreated, trackPaymentCreated } from '../lib/track';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart: cartData, cartTotal, clearCart, fetchCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  const cart = cartData?.items || [];
  const [products, setProducts] = useState({});
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [deliveryMethod, setDeliveryMethod] = useState('self-pickup');
  const [paymentMethod, setPaymentMethod] = useState('on-delivery');
  const [recipientData, setRecipientData] = useState({
    firstName: user?.full_name?.split(' ')[0] || '',
    lastName: user?.full_name?.split(' ')[1] || '',
    patronymic: '',
    phone: '',
    email: user?.email || '',
    city: '',
    address: '',
    postalCode: '',
    comment: ''
  });

  const [errors, setErrors] = useState({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [novaPoshtaData, setNovaPoshtaData] = useState(null);

  useEffect(() => {
    // Fetch cart on mount to ensure we have latest data
    fetchCart();
    // Track checkout start
    trackCheckoutStart();
  }, []);

  // Auto-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setRecipientData(prev => ({
        ...prev,
        firstName: user.full_name?.split(' ')[0] || prev.firstName,
        lastName: user.full_name?.split(' ')[1] || prev.lastName,
        phone: user.phone || prev.phone,
        email: user.email || prev.email,
        city: user.city || prev.city,
        address: user.address || prev.address,
        postalCode: user.postal_code || prev.postalCode,
      }));
      
      // Set delivery method based on saved data
      if (user.delivery_method) {
        setDeliveryMethod(user.delivery_method);
      }
      
      // Pre-fill Nova Poshta data if available
      if (user.delivery_method === 'nova_poshta' && user.np_department) {
        setNovaPoshtaData({
          department: user.np_department,
          city: user.city || ''
        });
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    } else {
      fetchCartProducts();
    }
  }, [cart, navigate]);

  const fetchCartProducts = async () => {
    try {
      setLoadingProducts(true);
      const productPromises = cart.map((item) =>
        productsAPI.getById(item.product_id).catch(() => null)
      );
      
      const productResults = await Promise.all(productPromises);
      const productsMap = {};
      
      productResults.forEach((res, idx) => {
        if (res) {
          productsMap[cart[idx].product_id] = res.data;
        }
      });
      
      setProducts(productsMap);
    } catch (error) {
      console.error('Failed to fetch cart products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const deliveryOptions = [
    {
      id: 'self-pickup',
      name: t('selfPickup'),
      description: t('selfPickupDesc'),
      price: 0,
      icon: Home
    },
    {
      id: 'courier',
      name: t('courierDelivery'),
      description: t('courierDesc'),
      price: 149,
      smartFree: true,
      icon: Truck
    },
    {
      id: 'nova-poshta',
      name: t('novaPoshtaPickup'),
      description: t('novaPoshtaDesc'),
      price: 72,
      icon: Package
    },
    {
      id: 'ukrposhta',
      name: t('ukrposhtaPickup'),
      description: t('ukrposhtaDesc'),
      price: 0,
      free: true,
      icon: Package
    }
  ];

  const paymentOptions = [
    {
      id: 'on-delivery',
      name: t('payOnDelivery'),
      description: t('payOnDeliveryDesc')
    },
    {
      id: 'online',
      name: t('payOnlineRozetka'),
      description: t('payOnlineDesc')
    },
    {
      id: 'card-rozetka',
      name: t('payWithBazaarCard'),
      description: t('payWithBazaarCardDesc'),
      badge: 'Discount',
      disabled: true
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!recipientData.firstName.trim()) {
      newErrors.firstName = t('enterFirstName');
    }
    if (!recipientData.lastName.trim()) {
      newErrors.lastName = t('enterLastName');
    }
    if (!recipientData.phone.trim()) {
      newErrors.phone = t('enterPhone');
    } else if (!/^\+?38?0\d{9}$/.test(recipientData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('invalidPhoneFormat');
    }
    if (!recipientData.email.trim()) {
      newErrors.email = t('enterEmail');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientData.email)) {
      newErrors.email = t('invalidEmailFormat');
    }

    // Address validation for standard delivery methods
    if (deliveryMethod === 'courier') {
      if (!recipientData.city.trim()) {
        newErrors.city = t('enterCity');
      }
      if (!recipientData.address.trim()) {
        newErrors.address = t('enterAddress');
      }
    }

    // Ukrposhta validation (включает индекс)
    if (deliveryMethod === 'ukrposhta') {
      if (!recipientData.city.trim()) {
        newErrors.city = t('enterCity');
      }
      if (!recipientData.address.trim()) {
        newErrors.address = t('enterAddress');
      }
      if (!recipientData.postalCode.trim()) {
        newErrors.postalCode = t('language') === 'ru' ? 'Введите почтовый индекс' : 'Введіть поштовий індекс';
      } else if (!/^\d{5}$/.test(recipientData.postalCode)) {
        newErrors.postalCode = t('language') === 'ru' ? 'Индекс должен состоять из 5 цифр' : 'Індекс має складатися з 5 цифр';
      }
    }

    // Nova Poshta validation
    if (deliveryMethod === 'nova-poshta') {
      if (!novaPoshtaData || !novaPoshtaData.city) {
        newErrors.city = 'Оберіть місто';
      }
      if (!novaPoshtaData || !novaPoshtaData.warehouse) {
        newErrors.warehouse = 'Оберіть відділення Нової Пошти';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Phone format mask
  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 5) return `+${digits.slice(0,2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `+${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5)}`;
    if (digits.length <= 10) return `+${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,8)} ${digits.slice(8)}`;
    return `+${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,8)} ${digits.slice(8,10)} ${digits.slice(10,12)}`;
  };

  const handleInputChange = (field, value) => {
    // Apply phone formatting
    if (field === 'phone') {
      value = formatPhone(value);
    }
    setRecipientData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePlaceOrder = async () => {
    // Prevent double-click
    if (isProcessingPayment) return;
    
    if (!validateForm()) {
      toast.error('Будь ласка, заповніть всі обов\'язкові поля');
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Create order
      const orderNumber = `ORDER-${Date.now()}`;
      const orderData = {
        order_number: orderNumber,
        buyer_id: user?.id || 'guest',
        items: cart.map(item => {
          const product = products[item.product_id];
          return {
            product_id: item.product_id,
            title: product?.title || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            seller_id: product?.seller_id || 'unknown'
          };
        }),
        total_amount: totalWithDelivery,
        currency: 'UAH',
        shipping_address: deliveryMethod === 'nova-poshta' && novaPoshtaData ? {
          street: novaPoshtaData.warehouse ? novaPoshtaData.warehouse.address : 'N/A',
          city: novaPoshtaData.city || 'N/A',
          state: '',
          postal_code: '',
          country: 'UA',
          warehouse_ref: novaPoshtaData.warehouse?.ref,
          warehouse_number: novaPoshtaData.warehouse?.number
        } : {
          street: recipientData.address || 'N/A',
          city: recipientData.city || 'N/A',
          state: '',
          postal_code: '',
          country: 'UA'
        },
        status: 'pending',
        payment_status: paymentMethod === 'online' ? 'pending' : 'cash_on_delivery',
        payment_method: paymentMethod
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      
      // Track order created
      trackOrderCreated(orderNumber, totalWithDelivery);

      // If online payment, process payment with RozetkaPay (Hosted Checkout)
      console.log('Payment method selected:', paymentMethod);
      if (paymentMethod === 'online') {
        console.log('Processing RozetkaPay payment...');
        // Track payment initiated
        trackPaymentCreated(orderNumber, 'online');
        try {
          const paymentData = {
            external_id: orderNumber,
            amount: totalWithDelivery,
            currency: 'UAH',
            customer: {
              email: recipientData.email,
              first_name: recipientData.firstName,
              last_name: recipientData.lastName,
              phone: recipientData.phone
            },
            description: `Оплата замовлення ${orderNumber}`
          };

          const paymentResponse = await fetch(
            `${process.env.REACT_APP_BACKEND_URL}/api/payment/rozetkapay/create`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(paymentData)
            }
          );

          if (!paymentResponse.ok) {
            throw new Error('Failed to process payment');
          }

          const paymentResult = await paymentResponse.json();

          if (paymentResult.success && paymentResult.action) {
            // Redirect to RozetkaPay hosted checkout page
            toast.info('Перенаправлення на сторінку оплати...');
            setTimeout(() => {
              window.location.href = paymentResult.action.value;
            }, 1000);
            return;
          } else {
            throw new Error(paymentResult.error || 'Payment creation failed');
          }
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          toast.error(`Помилка оплати: ${paymentError.message}`);
          setIsProcessingPayment(false);
          return;
        }
      }

      // For cash on delivery, just create order
      toast.success('Замовлення успішно оформлено!');
      clearCart();
      navigate('/checkout/success', { 
        state: { 
          orderNumber, 
          paymentMethod: paymentMethod 
        } 
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(`Помилка при оформленні замовлення: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const selectedDelivery = deliveryOptions.find(opt => opt.id === deliveryMethod);
  const deliveryPrice = selectedDelivery?.price || 0;
  const totalWithDelivery = cartTotal + deliveryPrice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12">
      <div className="container-main">
        <div className="mb-10 animate-slideInLeft">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Оформлення замовлення
          </h1>
          <p className="text-gray-600 text-lg">Крок 1 з 2 - Введіть дані доставки</p>
        </div>

        <div className="flex gap-8">
          {/* Left Column - Forms */}
          <div className="flex-1 space-y-8">
            {/* Auth Block (if not authenticated) */}
            {!isAuthenticated && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border-2 border-blue-300 shadow-xl animate-fadeIn">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-extrabold mb-3 text-gray-900">
                      {t('quickCheckout') || '⚡ Швидке оформлення'}
                    </h2>
                    <p className="text-gray-700 mb-6 text-lg leading-relaxed">
                      {t('loginBenefits') || 'Увійдіть в акаунт щоб автоматично заповнити дані доставки та швидше оформити замовлення'}
                    </p>
                    <div className="flex gap-4">
                      <Button 
                        onClick={() => navigate('/login', { state: { from: '/checkout' } })} 
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      >
                        <User className="w-5 h-5" />
                        {t('login') || 'Увійти'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Just collapse this notice, user can continue as guest
                          document.getElementById('guest-notice')?.remove();
                        }}
                        className="border-2 border-gray-300 hover:border-blue-600 px-6 py-3 rounded-xl font-semibold"
                      >
                        {t('continueAsGuest') || 'Продовжити як гість'} →
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Saved Address Display & Quick-fill for authenticated users */}
            {isAuthenticated && user && (user.city || user.address || user.phone || user.np_department) && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900 text-lg">
                        {t('savedAddress') || 'Збережена адреса'}
                      </p>
                      <p className="text-sm text-green-700">
                        {t('useSavedAddress') || 'Використайте збережені дані для швидкого оформлення'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Display Saved Address Details */}
                <div className="bg-white rounded-xl p-4 mb-4 border border-green-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {user.full_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Ім'я:</span>
                        <span className="text-gray-700">{user.full_name}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Телефон:</span>
                        <span className="text-gray-700">{user.phone}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Email:</span>
                        <span className="text-gray-700">{user.email}</span>
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Місто:</span>
                        <span className="text-gray-700">{user.city}</span>
                      </div>
                    )}
                    {user.delivery_method === 'nova_poshta' && user.np_department && (
                      <div className="flex items-center gap-2 col-span-2">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Відділення:</span>
                        <span className="text-gray-700">{user.np_department}</span>
                      </div>
                    )}
                    {user.address && user.delivery_method !== 'nova_poshta' && (
                      <div className="flex items-center gap-2 col-span-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Адреса:</span>
                        <span className="text-gray-700">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      // Re-fill form with saved data
                      setRecipientData({
                        firstName: user.full_name?.split(' ')[0] || '',
                        lastName: user.full_name?.split(' ')[1] || '',
                        patronymic: recipientData.patronymic || '',
                        phone: user.phone || '',
                        email: user.email || '',
                        city: user.city || '',
                        address: user.address || '',
                        postalCode: user.postal_code || '',
                        comment: recipientData.comment || ''
                      });
                      
                      if (user.delivery_method) {
                        setDeliveryMethod(user.delivery_method);
                      }
                      
                      if (user.delivery_method === 'nova_poshta' && user.np_department) {
                        setNovaPoshtaData({
                          department: user.np_department,
                          city: user.city || ''
                        });
                      }
                      
                      toast.success('Дані автоматично заповнені!');
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                    {t('useThisAddress') || 'Використати цю адресу'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    {t('editAddress') || 'Редагувати адресу'}
                  </Button>
                </div>
                
                <p className="text-xs text-green-600 mt-3">
                  ℹ️ {t('canEnterNewAddress') || 'Ви також можете ввести нову адресу нижче, якщо потрібно'}
                </p>
              </div>
            )}

            {/* Recipient Data */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-6 h-6" />
                Отримувач
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Прізвище <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Іванов"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ім'я <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Іван"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">По батькові</label>
                  <input
                    type="text"
                    value={recipientData.patronymic}
                    onChange={(e) => handleInputChange('patronymic', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Іванович"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Мобільний телефон <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={recipientData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+38 (0__) ___-__-__"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={recipientData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="example@mail.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6" />
                Доставка
              </h2>

              <div className="space-y-3">
                {deliveryOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setDeliveryMethod(option.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${
                        deliveryMethod === option.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="radio"
                            checked={deliveryMethod === option.id}
                            onChange={() => setDeliveryMethod(option.id)}
                            className="mt-1 w-5 h-5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <IconComponent className="w-5 h-5 text-gray-600" />
                              <p className="font-semibold">{option.name}</p>
                            </div>
                            <p className="text-sm text-gray-600">{option.description}</p>
                            
                            {deliveryMethod === option.id && option.id === 'self-pickup' && (
                              <div className="mt-3">
                                <input
                                  type="text"
                                  placeholder="виберіть відповідне відділення"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                />
                                <Button variant="outline" className="mt-2" size="sm">
                                  Обрати на мапі
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {option.free && (
                            <span className="text-green-600 font-semibold">Безкоштовно</span>
                          )}
                          {!option.free && option.price === 0 && (
                            <span className="text-green-600 font-semibold">Безкоштовно</span>
                          )}
                          {!option.free && option.price > 0 && (
                            <div>
                              <span className="font-semibold">{option.price} ₴</span>
                              {option.smartFree && (
                                <p className="text-xs text-gray-500">або безкоштовно зі SMART</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nova Poshta Delivery Form */}
              {deliveryMethod === 'nova-poshta' && (
                <div className="mt-4">
                  <NovaPoshtaDelivery
                    onAddressChange={(data) => setNovaPoshtaData(data)}
                    initialCity={recipientData.city}
                  />
                </div>
              )}

              {/* Address Form for Courier */}
              {deliveryMethod === 'courier' && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('language') === 'ru' ? 'Город' : 'Місто'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.city ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('language') === 'ru' ? 'Киев' : 'Київ'}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('language') === 'ru' ? 'Адрес' : 'Адреса'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('language') === 'ru' ? 'ул. Крещатик, 1' : 'вул. Хрещатик, 1'}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Address Form for Ukrposhta with Postal Code */}
              {deliveryMethod === 'ukrposhta' && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('language') === 'ru' ? 'Город' : 'Місто'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={t('language') === 'ru' ? 'Киев' : 'Київ'}
                      />
                      {errors.city && (
                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('language') === 'ru' ? 'Почтовый индекс' : 'Поштовий індекс'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.postalCode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="01001"
                        maxLength={5}
                      />
                      {errors.postalCode && (
                        <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('language') === 'ru' ? 'Адрес отделения Укрпочты' : 'Адреса відділення Укрпошти'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('language') === 'ru' ? 'ул. Крещатик, 1 (отделение №1)' : 'вул. Хрещатик, 1 (відділення №1)'}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div className="ml-3 text-sm text-blue-700">
                        <p className="font-medium mb-1">
                          {t('language') === 'ru' ? 'Информация о доставке Укрпочты:' : 'Інформація про доставку Укрпошти:'}
                        </p>
                        <p>
                          {t('language') === 'ru' 
                            ? 'Укажите индекс и адрес ближайшего отделения Укрпочты. Посылка будет доставлена в указанное отделение для самовывоза.'
                            : 'Вкажіть індекс та адресу найближчого відділення Укрпошти. Посилка буде доставлена до вказаного відділення для самовивозу.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6" />
                Оплата
              </h2>

              <div className="space-y-3">
                {paymentOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      if (option.disabled) {
                        toast.info('Цей метод оплати тимчасово недоступний');
                        return;
                      }
                      setPaymentMethod(option.id);
                    }}
                    className={`p-4 border rounded-xl transition-all ${
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-50'
                        : `cursor-pointer ${
                            paymentMethod === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === option.id}
                        disabled={option.disabled}
                        onChange={() => {
                          if (option.disabled) return;
                          setPaymentMethod(option.id);
                        }}
                        className="mt-1 w-5 h-5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{option.name}</p>
                          {option.badge && (
                            <span className="px-2 py-1 bg-yellow-400 text-xs font-semibold rounded">
                              {option.badge}
                            </span>
                          )}
                          {option.disabled && (
                            <span className="px-2 py-1 bg-gray-300 text-xs font-semibold rounded text-gray-600">
                              Недоступно
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Info */}
              {paymentMethod === 'online' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-green-800 mb-1">Безпечна онлайн оплата</p>
                        <p className="text-sm text-green-700">
                          Після натискання "Підтвердити замовлення" ви будете перенаправлені на захищену сторінку RozetkaPay для введення даних карти.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Certificate */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Сертифікат</h3>
                  <Button variant="outline" size="sm">
                    Додати
                  </Button>
                </div>
              </div>
            </div>

            {/* Comment */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold mb-4">Коментар до замовлення</h3>
              <textarea
                value={recipientData.comment}
                onChange={(e) => handleInputChange('comment', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Додаткова інформація для кур'єра..."
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-6">
              <h2 className="text-xl font-bold mb-6">Ваше замовлення</h2>

              {/* Products */}
              <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                {cart.map((item) => {
                  const product = products[item.product_id];
                  return (
                    <div key={item.product_id} className="flex gap-3 pb-4 border-b border-gray-100">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                        {product?.images?.[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{product?.title || 'Loading...'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{cart.length} товарів</span>
                  <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-semibold">
                    {deliveryPrice === 0 ? (
                      <span className="text-green-600">Безкоштовно</span>
                    ) : (
                      `${deliveryPrice} ₴`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                  <span>До сплати:</span>
                  <span>${totalWithDelivery.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <Button
                onClick={handlePlaceOrder}
                disabled={isProcessingPayment}
                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-lg py-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Обробка...</span>
                  </div>
                ) : (
                  'Підтвердити замовлення'
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Натискаючи кнопку, ви погоджуєтесь з умовами обробки персональних даних
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;