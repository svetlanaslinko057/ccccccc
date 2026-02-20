import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Eye, EyeOff, Image as ImageIcon, ExternalLink } from 'lucide-react';
import axios from 'axios';

const ActualOffersManagement = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image_url: '',
    banner_image_url: '',
    link_url: '/products',
    background_color: '#3b82f6',
    text_color: '#ffffff',
    position: 0,
    order: 0,
    active: true,
    product_ids: []
  });

  const colorPresets = [
    { name: 'Синій', bg: '#3b82f6', text: '#ffffff' },
    { name: 'Червоний', bg: '#ef4444', text: '#ffffff' },
    { name: 'Помаранчевий', bg: '#f97316', text: '#000000' },
    { name: 'Фіолетовий', bg: '#a855f7', text: '#ffffff' },
    { name: 'Жовтий', bg: '#eab308', text: '#000000' },
    { name: 'Зелений', bg: '#22c55e', text: '#ffffff' },
  ];

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOffers(response.data);
    } catch (error) {
      console.error('Failed to fetch offers:', error);
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
      toast.error('Помилка завантаження зображення');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!form.image_url) {
      toast.error('Завантажте зображення для баннера');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // Подготавливаем данные
      const saveData = { ...form, product_ids: selectedProducts };
      
      if (editingOffer) {
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers/${editingOffer.id}`,
          saveData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Пропозицію оновлено!');
      } else {
        // При создании автоматически устанавливаем link_url
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers`,
          saveData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Обновляем link_url на /offer/{id}
        const offerId = response.data.id;
        await axios.put(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers/${offerId}`,
          { link_url: `/offer/${offerId}` },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        toast.success('Пропозицію створено!');
      }
      
      setShowAddForm(false);
      setEditingOffer(null);
      setSelectedProducts([]);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error('Failed to save offer:', error);
      toast.error('Помилка збереження');
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Видалити цю пропозицію?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers/${offerId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Пропозицію видалено!');
      fetchOffers();
    } catch (error) {
      toast.error('Помилка видалення');
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/actual-offers/${offer.id}`,
        { active: !offer.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(offer.active ? 'Пропозицію приховано' : 'Пропозицію активовано');
      fetchOffers();
    } catch (error) {
      toast.error('Помилка зміни статусу');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title,
      subtitle: offer.subtitle || '',
      description: offer.description || '',
      image_url: offer.image_url,
      banner_image_url: offer.banner_image_url || '',
      link_url: offer.link_url,
      background_color: offer.background_color || '#3b82f6',
      text_color: offer.text_color || '#ffffff',
      position: offer.position,
      order: offer.order,
      active: offer.active,
      product_ids: offer.product_ids || []
    });
    setSelectedProducts(offer.product_ids || []);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      subtitle: '',
      description: '',
      image_url: '',
      banner_image_url: '',
      link_url: '/offer/new',
      background_color: '#3b82f6',
      text_color: '#ffffff',
      position: offers?.length || 0,
      order: offers?.length || 0,
      active: true,
      product_ids: []
    });
    setSelectedProducts([]);
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
          <h2 className="text-2xl font-bold">Актуальні пропозиції</h2>
          <p className="text-gray-600 mt-1">Керуйте баннерами на головній сторінці (максимум 5)</p>
        </div>
        <Button 
          onClick={() => {
            setEditingOffer(null);
            resetForm();
            setShowAddForm(!showAddForm);
          }}
          disabled={(offers?.length || 0) >= 5 && !editingOffer}
        >
          <Plus className="w-4 h-4 mr-2" />
          Додати пропозицію
        </Button>
      </div>

      {(offers?.length || 0) >= 5 && !editingOffer && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Досягнуто максимум (5 пропозицій). Видаліть одну для додавання нової.
          </p>
        </div>
      )}

      {/* Форма */}
      {showAddForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">
            {editingOffer ? 'Редагувати пропозицію' : 'Нова актуальна пропозиція'}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Заголовок *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ТЕЛЕВІЗОРИ"
                  required
                />
              </div>
              <div>
                <Label>Підзаголовок</Label>
                <Input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="ЗНИЖКИ ДО -45%"
                />
              </div>
            </div>

            <div>
              <Label>Зображення баннера *</Label>
              <div className="space-y-3">
                <div>
                  <input
                    type="file"
                    id="offer-image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="offer-image-upload"
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
                  placeholder="https://example.com/banner.jpg"
                />
                
                {form.image_url && (
                  <div className="mt-3">
                    <Label className="text-sm text-gray-600 mb-2 block">Передпрогляд:</Label>
                    <img 
                      src={form.image_url} 
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label>Опис пропозиції</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Детальний опис акції..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Відображається на сторінці пропозиції
              </p>
            </div>

            <div>
              <Label>Виберіть товари для акції</Label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm">Товарів немає</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <label key={product.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm flex-1">{product.title}</span>
                        <span className="text-sm text-gray-500">${product.price}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Вибрано: {selectedProducts.length} товарів
              </p>
            </div>

            <div>
              <Label>Посилання (автоматичне)</Label>
              <Input
                value={form.link_url}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Після створення автоматично встановиться /offer/{'{id}'}
              </p>
            </div>

            <div>
              <Label>Колір фону</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setForm({ 
                      ...form, 
                      background_color: preset.bg,
                      text_color: preset.text
                    })}
                    className={`h-12 rounded-lg border-2 ${
                      form.background_color === preset.bg
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: preset.bg }}
                    title={preset.name}
                  />
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  type="color"
                  value={form.background_color}
                  onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={form.background_color}
                  onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>Позиція в сітці (0-4)</Label>
              <Input
                type="number"
                min="0"
                max="4"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500 mt-1">
                0 = великий блок зліва, 1-4 = інші позиції
              </p>
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
                {editingOffer ? 'Зберегти зміни' : 'Створити пропозицію'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingOffer(null);
                  resetForm();
                }}
              >
                Скасувати
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Список пропозицій */}
      <div className="grid gap-4">
        {(offers?.length || 0) === 0 ? (
          <Card className="p-12 text-center">
            <ExternalLink className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Немає актуальних пропозицій</h3>
            <p className="text-gray-600 mb-6">Створіть баннери для блоку "Актуальні пропозиції"</p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Додати пропозицію
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <Card key={offer.id} className={`overflow-hidden ${!offer.active ? 'opacity-60' : ''}`}>
                {/* Предпросмотр */}
                <div 
                  className="h-48 relative"
                  style={{ 
                    backgroundColor: offer.background_color,
                    color: offer.text_color 
                  }}
                >
                  {offer.image_url && (
                    <img 
                      src={offer.image_url} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-xl font-bold drop-shadow-lg">{offer.title}</h3>
                    {offer.subtitle && (
                      <p className="text-sm drop-shadow-md">{offer.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Управление */}
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <ExternalLink className="w-4 h-4" />
                    <span className="truncate">{offer.link_url}</span>
                  </div>
                  
                  {!offer.active && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mb-2 inline-block">
                      Прихована
                    </span>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(offer)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Редагувати
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(offer)}
                    >
                      {offer.active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Приховати
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Показати
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(offer.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Видалити
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Предпросмотр сетки */}
      {(offers?.length || 0) > 0 && (
        <Card className="p-6 bg-gray-50">
          <h3 className="font-bold mb-4">Попередній перегляд на сайті:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {offers.filter(o => o.active).slice(0, 5).map((offer, index) => {
              const gridClass = index === 0 
                ? 'col-span-2 md:col-span-2 row-span-1 md:row-span-2' 
                : index === 1
                ? 'col-span-2 md:col-span-1 md:row-span-2'
                : 'col-span-1';

              return (
                <div
                  key={offer.id}
                  className={`${gridClass} relative overflow-hidden rounded-2xl min-h-[150px]`}
                  style={{ backgroundColor: offer.background_color }}
                >
                  {offer.image_url && (
                    <img 
                      src={offer.image_url} 
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-4">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg">{offer.title}</h3>
                    {offer.subtitle && (
                      <p className="text-sm text-white drop-shadow-md">{offer.subtitle}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ActualOffersManagement;
