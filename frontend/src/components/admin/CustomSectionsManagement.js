import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, Save, X } from 'lucide-react';
import { Button } from '../ui/button';

const CustomSectionsManagement = () => {
  const [sections, setSections] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    product_ids: [],
    display_on_home: true,
    order: 0,
    active: true
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [sectionsRes, productsRes] = await Promise.all([
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/custom-sections`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/products?limit=100`)
      ]);
      
      setSections(sectionsRes.data.sort((a, b) => a.order - b.order));
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Помилка завантаження даних');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingId
        ? `${process.env.REACT_APP_BACKEND_URL}/api/admin/custom-sections/${editingId}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/admin/custom-sections`;
      
      const method = editingId ? 'put' : 'post';
      
      await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(editingId ? 'Розділ оновлено!' : 'Розділ створено!');
      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Помилка збереження розділу');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      product_ids: [],
      display_on_home: true,
      order: sections.length,
      active: true
    });
  };

  const handleEdit = (section) => {
    setEditingId(section.id);
    setFormData({
      title: section.title,
      slug: section.slug,
      description: section.description || '',
      product_ids: section.product_ids || [],
      display_on_home: section.display_on_home,
      order: section.order,
      active: section.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Видалити цей розділ?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/custom-sections/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Розділ видалено!');
      fetchData();
    } catch (error) {
      toast.error('Помилка видалення розділу');
    }
  };

  const toggleProductSelection = (productId) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Кастомні розділи</h2>
          <p className="text-sm text-gray-600 mt-1">
            Хіти продажу, Новинки, Популярні та інші розділи
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            resetForm();
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Створити розділ
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Редагувати розділ' : 'Новий розділ'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Назва розділу *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Хіти продажу"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug (URL) *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                placeholder="bestsellers"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
                disabled={editingId !== null}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Опис</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Короткий опис розділу..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Товари в розділі ({formData.product_ids.length})</label>
            <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white">
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Немає товарів в базі</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {products.map((product) => (
                    <label
                      key={product.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.product_ids.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4"
                      />
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/50'}
                        alt={product.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{product.title}</p>
                        <p className="text-xs text-gray-500">{product.price} ₴</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Порядок</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.display_on_home}
                onChange={(e) => setFormData({ ...formData, display_on_home: e.target.checked })}
                className="w-4 h-4"
                id="display_on_home"
              />
              <label htmlFor="display_on_home" className="text-sm font-medium">
                Показувати на головній
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4"
                id="active"
              />
              <label htmlFor="active" className="text-sm font-medium">
                Активний
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              {editingId ? 'Оновити' : 'Створити'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="bg-gray-400 hover:bg-gray-500"
            >
              Скасувати
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {sections.map((section) => (
          <div
            key={section.id}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-xl">{section.title}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    /{section.slug}
                  </span>
                  {section.active ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Активний</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Неактивний</span>
                  )}
                </div>
                {section.description && (
                  <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                )}
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>Товарів: {section.product_ids?.length || 0}</span>
                  <span>Порядок: {section.order}</span>
                  {section.display_on_home && <span className="text-blue-600">📍 На головній</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleEdit(section)}
                  className="bg-blue-600 hover:bg-blue-700 text-sm py-2"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Редагувати
                </Button>
                <Button
                  onClick={() => handleDelete(section.id)}
                  className="bg-red-600 hover:bg-red-700 text-sm py-2 px-3"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sections.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">Немає розділів. Створіть перший!</p>
          <p className="text-sm">Наприклад: "Хіти продажу", "Новинки", "Популярні"</p>
        </div>
      )}
    </div>
  );
};

export default CustomSectionsManagement;
