import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, EyeOff, Image as ImageIcon, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';

const PromotionsManagement = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    detailed_description: '',
    image_url: '',
    discount_text: '',
    link_url: '/products',
    countdown_enabled: false,
    countdown_end_date: '',
    background_color: '#ffffff',
    text_color: '#000000',
    badge_color: '#ef4444',
    order: 0,
    active: true
  });

  const colorPresets = [
    { name: 'Червоний', value: '#ef4444' },
    { name: 'Помаранчевий', value: '#f97316' },
    { name: 'Зелений', value: '#22c55e' },
    { name: 'Синій', value: '#3b82f6' },
    { name: 'Фіолетовий', value: '#a855f7' },
    { name: 'Рожевий', value: '#ec4899' },
  ];

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPromotions(response.data);
    } catch (error) {
      console.error('Failed to fetch promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Будь ласка, оберіть файл зображення');
      return;
    }
    
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
      
      const imageUrl = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      setForm({ ...form, image_url: imageUrl });
      
      toast.success('Зображення завантажено!');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Помилка завантаження зображення: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!form.image_url) {
      toast.error('Завантажте зображення');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const saveData = { ...form };
      
      if (saveData.countdown_enabled && saveData.countdown_end_date) {
        saveData.countdown_end_date = new Date(saveData.countdown_end_date).toISOString();
      }
      
      if (editingPromotion) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions/${editingPromotion.id}`,
          saveData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Акцію оновлено!');
      } else {
        await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions`,
          saveData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Акцію створено!');
      }
      
      setShowAddForm(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Failed to save promotion:', error);
      toast.error('Помилка збереження');
    }
  };

  const handleDelete = async (promotionId) => {
    if (!window.confirm('Видалити цю акцію?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions/${promotionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Акцію видалено!');
      fetchPromotions();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const handleToggleActive = async (promotion) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions/${promotion.id}`,
        { active: !promotion.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(promotion.active ? 'Акцію приховано' : 'Акцію активовано');
      fetchPromotions();
    } catch (error) {
      toast.error('Помилка зміни статусу');
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setForm({
      title: promotion.title,
      description: promotion.description,
      detailed_description: promotion.detailed_description || '',
      image_url: promotion.image_url,
      discount_text: promotion.discount_text || '',
      link_url: promotion.link_url || '/products',
      countdown_enabled: promotion.countdown_enabled,
      countdown_end_date: promotion.countdown_end_date 
        ? new Date(promotion.countdown_end_date).toISOString().slice(0, 16) 
        : '',
      background_color: promotion.background_color || '#ffffff',
      text_color: promotion.text_color || '#000000',
      badge_color: promotion.badge_color || '#ef4444',
      order: promotion.order,
      active: promotion.active
    });
    setShowAddForm(true);
  };

  const handleMove = async (promotionId, direction) => {
    const currentIndex = promotions.findIndex(p => p.id === promotionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === (promotions?.length || 0) - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const promo1 = promotions[currentIndex];
    const promo2 = promotions[newIndex];

    try {
      const token = localStorage.getItem('token');
      await Promise.all([
        axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions/${promo1.id}`,
          { order: promo2.order },
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/promotions/${promo2.id}`,
          { order: promo1.order },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);
      fetchPromotions();
    } catch (error) {
      toast.error('Помилка зміни порядку');
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      detailed_description: '',
      image_url: '',
      discount_text: '',
      link_url: '/products',
      countdown_enabled: false,
      countdown_end_date: '',
      background_color: '#ffffff',
      text_color: '#000000',
      badge_color: '#ef4444',
      order: promotions?.length || 0,
      active: true
    });
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Управління акціями</h2>
          <p className="text-gray-600 mt-1">Створюйте та редагуйте акційні пропозиції</p>
        </div>
        <Button 
          onClick={() => {
            setEditingPromotion(null);
            resetForm();
            setShowAddForm(!showAddForm);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Додати акцію
        </Button>
      </div>

      {/* Форма */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {editingPromotion ? 'Редагувати акцію' : 'Нова акція'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Назва акції *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Чорна п'ятниця"
                  required
                />
              </div>
              <div>
                <Label>Текст знижки</Label>
                <Input
                  value={form.discount_text}
                  onChange={(e) => setForm({ ...form, discount_text: e.target.value })}
                  placeholder="-50% або 2+1"
                />
              </div>
            </div>

            <div>
              <Label>Короткий опис акції *</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Короткий опис для картки (1-2 речення)..."
                rows="2"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Відображається на картці акції</p>
            </div>

            <div>
              <Label>Детальний опис акції</Label>
              <textarea
                value={form.detailed_description}
                onChange={(e) => setForm({ ...form, detailed_description: e.target.value })}
                placeholder="Повний детальний опис акції для окремої сторінки. Розкажіть про всі умови, деталі та переваги..."
                rows="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Відображається на окремій сторінці акції. Можна написати довгий текст зі всіма деталями.
              </p>
            </div>

            <div>
              <Label>Зображення акції *</Label>
              <div className="space-y-3">
                <div>
                  <input
                    type="file"
                    id="promo-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="promo-image-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {uploadingImage ? 'Завантаження...' : 'Завантажити зображення'}
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-sm text-gray-500">АБО</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/promo.jpg"
                />
                
                {form.image_url && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600 mb-2 block">Передпрогляд:</Label>
                    <img 
                      src={form.image_url} 
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Посилання на товари</Label>
              <Input
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="/products або /products?category_id=xxx"
              />
            </div>

            <div>
              <Label>Колір бейджа знижки</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {colorPresets.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setForm({ ...form, badge_color: color.value })}
                    className={`h-12 rounded-lg border-2 ${
                      form.badge_color === color.value
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
              <div className="flex items-center gap-4 mb-3">
                <input
                  type="checkbox"
                  id="countdown_enabled"
                  checked={form.countdown_enabled}
                  onChange={(e) => setForm({ ...form, countdown_enabled: e.target.checked })}
                  className="w-5 h-5"
                />
                <Label htmlFor="countdown_enabled" className="cursor-pointer font-bold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  Таймер зворотного відліку ⏰
                </Label>
              </div>
              
              {form.countdown_enabled && (
                <div className="bg-white p-4 rounded border border-orange-300">
                  <Label className="font-semibold">Дата та час закінчення акції *</Label>
                  <Input
                    type="datetime-local"
                    value={form.countdown_end_date}
                    onChange={(e) => setForm({ ...form, countdown_end_date: e.target.value })}
                    required={form.countdown_enabled}
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Активна (відображається на сайті)
              </Label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                {editingPromotion ? 'Зберегти зміни' : 'Створити акцію'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
              >
                Скасувати
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Список акций */}
      <div className="grid gap-4">
        {(promotions?.length || 0) === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h3 className="text-xl font-semibold mb-2">Немає акцій</h3>
            <p className="text-gray-600 mb-6">Створіть акції для залучення покупців</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Створити акцію
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {promotions.map((promotion, index) => (
              <Card key={promotion.id} className={`overflow-hidden ${!promotion.active ? 'opacity-60' : ''}`}>
                {/* Preview */}
                <div className="relative h-48">
                  <img 
                    src={promotion.image_url} 
                    alt={promotion.title}
                    className="w-full h-full object-cover"
                  />
                  {promotion.discount_text && (
                    <div 
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-white font-bold text-sm"
                      style={{ backgroundColor: promotion.badge_color }}
                    >
                      {promotion.discount_text}
                    </div>
                  )}
                  {!promotion.active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold">
                        Прихована
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold mb-2 line-clamp-1">{promotion.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{promotion.description}</p>
                  
                  {promotion.countdown_enabled && promotion.countdown_end_date && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Clock className="w-3 h-3" />
                      До: {new Date(promotion.countdown_end_date).toLocaleDateString('uk-UA')}
                    </div>
                  )}

                  {/* Controls */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleMove(promotion.id, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      title="Вгору"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMove(promotion.id, 'down')}
                      disabled={index === (promotions?.length || 0) - 1}
                      className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                      title="Вниз"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(promotion)}
                      className="p-1 hover:bg-blue-100 rounded text-blue-600"
                      title="Редагувати"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(promotion)}
                      className="p-1 hover:bg-gray-100 rounded"
                      title={promotion.active ? 'Приховати' : 'Показати'}
                    >
                      {promotion.active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(promotion.id)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                      title="Видалити"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      {(promotions?.length || 0) > 0 && (
        <Card className="p-6 bg-gray-50">
          <h3 className="font-bold mb-4">Попередній перегляд на сайті:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promotions.filter(p => p.active).slice(0, 16).map((promo) => (
              <div key={promo.id} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                <div className="relative h-48">
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                  {promo.discount_text && (
                    <div 
                      className="absolute top-3 right-3 px-3 py-1 rounded-full text-white font-bold text-sm"
                      style={{ backgroundColor: promo.badge_color }}
                    >
                      {promo.discount_text}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm line-clamp-1">{promo.title}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{promo.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PromotionsManagement;
