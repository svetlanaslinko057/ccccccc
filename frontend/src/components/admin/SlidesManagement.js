import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, EyeOff, Image, Package, Calendar, ArrowUp, ArrowDown, Clock, Sparkles } from 'lucide-react';
import axios from 'axios';
import PopularCategoriesManagement from './PopularCategoriesManagement';
import ActualOffersManagement from './ActualOffersManagement';

const SlidesManagement = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddSlide, setShowAddSlide] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('slides');
  
  const [slideForm, setSlideForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    type: 'banner',
    product_id: '',
    image_url: '',
    background_gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    promo_text: '',
    button_text: 'Купить сейчас',
    button_link: '',
    countdown_enabled: false,
    countdown_end_date: '',
    order: 0,
    active: true
  });

  const gradients = [
    { name: 'Фиолетовый', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { name: 'Розовый', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { name: 'Синий', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { name: 'Зеленый', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Оранжевый', value: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { name: 'Темный', value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' }
  ];

  useEffect(() => {
    fetchSlides();
    fetchProducts();
  }, []);

  const fetchSlides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSlides(response.data);
    } catch (error) {
      console.error('Failed to fetch slides:', error);
      toast.error('Не вдалося завантажити слайди');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, оберіть файл зображення');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл занадто великий. Максимум 5 МБ');
      return;
    }
    
    try {
      setUploadingImage(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/upload/image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update form with uploaded image URL
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      setSlideForm({ ...slideForm, image_url: imageUrl });
      
      toast.success('Зображення завантажено!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Помилка завантаження зображення');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Необхідна авторизація');
        return;
      }
      
      // Валидация
      if (slideForm.type === 'banner' && !slideForm.image_url) {
        toast.error('Завантажте зображення або вкажіть URL');
        return;
      }
      
      if (slideForm.type === 'product' && !slideForm.product_id) {
        toast.error('Оберіть товар');
        return;
      }
      
      const slideData = { ...slideForm };
      
      // Конвертируем countdown_end_date в ISO формат
      if (slideData.countdown_enabled && slideData.countdown_end_date) {
        slideData.countdown_end_date = new Date(slideData.countdown_end_date).toISOString();
      } else {
        // Если таймер выключен, удаляем поле
        slideData.countdown_end_date = null;
      }
      
      console.log('Saving slide:', slideData);
      
      if (editingSlide) {
        // Update existing slide
        const response = await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides/${editingSlide.id}`,
          slideData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Slide updated:', response.data);
        toast.success('Слайд оновлено!');
      } else {
        // Create new slide
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides`,
          slideData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Slide created:', response.data);
        toast.success('Слайд створено!');
      }
      
      setShowAddSlide(false);
      setEditingSlide(null);
      resetForm();
      fetchSlides();
    } catch (error) {
      console.error('Failed to save slide:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Помилка збереження слайду';
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteSlide = async (slideId) => {
    if (!window.confirm('Видалити цей слайд?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides/${slideId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Слайд видалено!');
      fetchSlides();
    } catch (error) {
      console.error('Failed to delete slide:', error);
      toast.error('Помилка видалення слайду');
    }
  };

  const handleToggleActive = async (slide) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides/${slide.id}`,
        { active: !slide.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(slide.active ? 'Слайд приховано' : 'Слайд активовано');
      fetchSlides();
    } catch (error) {
      console.error('Failed to toggle slide:', error);
      toast.error('Помилка зміни статусу');
    }
  };

  const handleEditSlide = (slide) => {
    setEditingSlide(slide);
    setSlideForm({
      title: slide.title,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      type: slide.type,
      product_id: slide.product_id || '',
      image_url: slide.image_url || '',
      background_gradient: slide.background_gradient || gradients[0].value,
      promo_text: slide.promo_text || '',
      button_text: slide.button_text || 'Купить сейчас',
      button_link: slide.button_link || '',
      countdown_enabled: slide.countdown_enabled,
      countdown_end_date: slide.countdown_end_date ? new Date(slide.countdown_end_date).toISOString().slice(0, 16) : '',
      order: slide.order,
      active: slide.active
    });
    setShowAddSlide(true);
  };

  const handleMoveSlide = async (slideId, direction) => {
    const currentIndex = slides.findIndex(s => s.id === slideId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === (slides?.length || 0) - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const slide1 = slides[currentIndex];
    const slide2 = slides[newIndex];

    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides/${slide1.id}`,
          { order: slide2.order },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/slides/${slide2.id}`,
          { order: slide1.order },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);
      fetchSlides();
    } catch (error) {
      console.error('Failed to reorder slides:', error);
      toast.error('Помилка зміни порядку');
    }
  };

  const resetForm = () => {
    setSlideForm({
      title: '',
      subtitle: '',
      description: '',
      type: 'banner',
      product_id: '',
      image_url: '',
      background_gradient: gradients[0].value,
      promo_text: '',
      button_text: 'Купить сейчас',
      button_link: '',
      countdown_enabled: false,
      countdown_end_date: '',
      order: slides?.length || 0,
      active: true
    });
  };

  const getProductById = (productId) => {
    return products.find(p => p.id === productId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs для Слайдер, Популярні категорії та Актуальні пропозиції */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('slides')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'slides'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🖼️ Слайдер баннерів
          </button>
          <button
            onClick={() => setActiveSubTab('popular')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'popular'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Популярні категорії
          </button>
          <button
            onClick={() => setActiveSubTab('offers')}
            className={`pb-3 px-4 font-semibold transition-colors whitespace-nowrap ${
              activeSubTab === 'offers'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🎁 Актуальні пропозиції
          </button>
        </div>
      </div>

      {/* Content based on active sub-tab */}
      {activeSubTab === 'slides' ? (
        <>
          <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управление слайдером главной страницы</h2>
          <p className="text-gray-600 mt-1">Создавайте и редактируйте слайды для баннера</p>
        </div>
        <Button 
          onClick={() => {
            setEditingSlide(null);
            resetForm();
            setShowAddSlide(!showAddSlide);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить слайд
        </Button>
      </div>

      {/* Форма добавления/редактирования слайда */}
      {showAddSlide && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {editingSlide ? 'Редактировать слайд' : 'Новый слайд'}
          </h3>
          <form onSubmit={handleSaveSlide} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Заголовок *</Label>
                <Input
                  value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  placeholder="Например: СКИДКИ ДО 50%"
                  required
                />
              </div>
              <div>
                <Label>Подзаголовок</Label>
                <Input
                  value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  placeholder="Например: На всю электронику"
                />
              </div>
            </div>

            <div>
              <Label>Описание</Label>
              <Input
                value={slideForm.description}
                onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                placeholder="Дополнительное описание"
              />
            </div>

            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 mb-4">
              <Label className="text-lg font-bold mb-2 block">Тип слайда *</Label>
              <p className="text-sm text-gray-600 mb-3">Выберите один из двух вариантов:</p>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() => setSlideForm({ ...slideForm, type: 'banner' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    slideForm.type === 'banner' 
                      ? 'border-blue-600 bg-blue-100' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">Баннер с изображением</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Загрузите URL картинки. На баннере будут текст акции, таймер и кнопка.
                  </p>
                </div>
                <div
                  onClick={() => setSlideForm({ ...slideForm, type: 'product' })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    slideForm.type === 'product' 
                      ? 'border-blue-600 bg-blue-100' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <span className="font-bold">Товар с акцией</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Выберите товар из каталога. Будет показана его картинка и информация.
                  </p>
                </div>
              </div>
            </div>

            {slideForm.type === 'product' ? (
              <div className="border-l-4 border-green-500 pl-4">
                <Label>Выберите товар *</Label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md mt-2"
                  value={slideForm.product_id}
                  onChange={(e) => setSlideForm({ ...slideForm, product_id: e.target.value })}
                  required={slideForm.type === 'product'}
                >
                  <option value="">-- Выберите товар --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title} - ${product.price}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="border-l-4 border-blue-500 pl-4 space-y-3">
                <div>
                  <Label>Изображение для баннера *</Label>
                  <p className="text-xs text-gray-600 mb-2">
                    Выберите один из вариантов:
                  </p>
                  
                  {/* Кнопка загрузки файла */}
                  <div className="mb-3">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                        uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      {uploadingImage ? 'Завантаження...' : 'Завантажити з комп\'ютера'}
                    </label>
                  </div>
                  
                  {/* ИЛИ разделитель */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-sm text-gray-500">АБО</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  {/* Поле для URL */}
                  <div>
                    <Label>URL изображения</Label>
                    <Input
                      value={slideForm.image_url}
                      onChange={(e) => setSlideForm({ ...slideForm, image_url: e.target.value })}
                      placeholder="https://example.com/promo-banner.jpg"
                      className="mt-2"
                    />
                  </div>
                  
                  {/* Предпросмотр */}
                  {slideForm.image_url && (
                    <div className="mt-3">
                      <Label className="text-sm text-gray-600 mb-2 block">Передпрогляд:</Label>
                      <img 
                        src={slideForm.image_url} 
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Рекомендуемый размер: 1920x400px. Картинка будет фоном, на котором отобразятся текст и таймер.
                  </p>
                </div>
              </div>
            )}

            <div>
              <Label>Фоновый градиент</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {gradients.map((gradient) => (
                  <button
                    key={gradient.name}
                    type="button"
                    onClick={() => setSlideForm({ ...slideForm, background_gradient: gradient.value })}
                    className={`h-12 rounded-lg border-2 ${
                      slideForm.background_gradient === gradient.value
                        ? 'border-blue-600'
                        : 'border-gray-300'
                    }`}
                    style={{ background: gradient.value }}
                  >
                    <span className="text-white text-xs font-semibold drop-shadow-lg">
                      {gradient.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Промо текст</Label>
                <Input
                  value={slideForm.promo_text}
                  onChange={(e) => setSlideForm({ ...slideForm, promo_text: e.target.value })}
                  placeholder="Например: -30% СКИДКА"
                />
              </div>
              <div>
                <Label>Порядок (0 = первый)</Label>
                <Input
                  type="number"
                  value={slideForm.order}
                  onChange={(e) => setSlideForm({ ...slideForm, order: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Текст кнопки</Label>
                <Input
                  value={slideForm.button_text}
                  onChange={(e) => setSlideForm({ ...slideForm, button_text: e.target.value })}
                  placeholder="Купить сейчас"
                />
              </div>
              <div>
                <Label>Ссылка кнопки</Label>
                <Input
                  value={slideForm.button_link}
                  onChange={(e) => setSlideForm({ ...slideForm, button_link: e.target.value })}
                  placeholder="/products или https://..."
                />
              </div>
            </div>

            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="checkbox"
                  id="countdown_enabled"
                  checked={slideForm.countdown_enabled}
                  onChange={(e) => setSlideForm({ ...slideForm, countdown_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <Label htmlFor="countdown_enabled" className="cursor-pointer font-bold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Включить обратный отсчет до конца акции ⏰
                </Label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Таймер будет отображаться на слайде и показывать, сколько времени осталось до конца акции
              </p>
              
              {slideForm.countdown_enabled && (
                <div className="bg-white p-4 rounded border border-orange-300">
                  <Label className="font-semibold">Дата и время окончания акции *</Label>
                  <Input
                    type="datetime-local"
                    value={slideForm.countdown_end_date}
                    onChange={(e) => setSlideForm({ ...slideForm, countdown_end_date: e.target.value })}
                    required={slideForm.countdown_enabled}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Например: установите дату через неделю для недельной акции
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={slideForm.active}
                onChange={(e) => setSlideForm({ ...slideForm, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Активный (отображается на сайте)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingSlide ? 'Сохранить изменения' : 'Создать слайд'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddSlide(false);
                  setEditingSlide(null);
                  resetForm();
                }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Список слайдов */}
      <div className="grid gap-4">
        {(slides?.length || 0) === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Нет слайдов</h3>
            <p className="text-gray-600 mb-6">Создайте первый слайд для главной страницы</p>
            <Button onClick={() => setShowAddSlide(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить слайд
            </Button>
          </Card>
        ) : (
          slides.map((slide, index) => {
            const product = slide.type === 'product' ? getProductById(slide.product_id) : null;
            
            return (
              <Card key={slide.id} className={`p-6 ${!slide.active ? 'opacity-60' : ''}`}>
                <div className="flex gap-6">
                  {/* Предпросмотр */}
                  <div 
                    className="w-64 h-40 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                    style={{ background: slide.background_gradient }}
                  >
                    {slide.type === 'product' && product ? (
                      <div className="text-center p-4">
                        {product.images && product.images[0] && (
                          <img 
                            src={product.images[0]} 
                            alt={product.title}
                            className="w-24 h-24 object-contain mx-auto mb-2"
                          />
                        )}
                        <p className="text-sm font-bold">{product.title}</p>
                      </div>
                    ) : slide.image_url ? (
                      <img 
                        src={slide.image_url} 
                        alt={slide.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <p className="text-2xl font-bold">{slide.title}</p>
                        <p className="text-sm">{slide.subtitle}</p>
                      </div>
                    )}
                  </div>

                  {/* Информация */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{slide.title}</h3>
                          {slide.type === 'product' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              <Package className="w-3 h-3 inline mr-1" />
                              Товар
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              <Image className="w-3 h-3 inline mr-1" />
                              Баннер
                            </span>
                          )}
                          {!slide.active && (
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                              Скрыт
                            </span>
                          )}
                        </div>
                        {slide.subtitle && (
                          <p className="text-gray-600">{slide.subtitle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMoveSlide(slide.id, 'up')}
                          disabled={index === 0}
                          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveSlide(slide.id, 'down')}
                          disabled={index === (slides?.length || 0) - 1}
                          className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {slide.description && (
                      <p className="text-sm text-gray-600 mb-2">{slide.description}</p>
                    )}

                    {slide.promo_text && (
                      <p className="text-sm font-semibold text-orange-600 mb-2">
                        🔥 {slide.promo_text}
                      </p>
                    )}

                    {slide.countdown_enabled && slide.countdown_end_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Акция до: {new Date(slide.countdown_end_date).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSlide(slide)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(slide)}
                      >
                        {slide.active ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Скрыть
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Показать
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteSlide(slide.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      </>
      ) : activeSubTab === 'popular' ? (
        <PopularCategoriesManagement />
      ) : (
        <ActualOffersManagement />
      )}
    </div>
  );
};

export default SlidesManagement;
