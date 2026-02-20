import React, { useState, useEffect } from 'react';
import { categoriesAPI, productsAPI } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Save, X, Search, ShoppingBag,
  Smartphone, Laptop, Monitor, Tv, Watch, Camera, Headphones, Gamepad,
  Home, Zap, Coffee, Microwave, Fan, Wind, Snowflake,
  Shirt, Heart, Book, Music, Car, Bike, Dumbbell, Baby,
  Pill, Leaf, Palette, Wrench, Hammer, Lightbulb, Wifi, Speaker
} from 'lucide-react';

/**
 * Category Management Component
 * 
 * Allows managing categories with bidirectional product assignment:
 * 1. Assign products when creating/editing category
 * 2. Products show their assigned category
 */
const CategoryManagement = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: null,
    icon: 'Smartphone'
  });
  const [iconSearch, setIconSearch] = useState('');

  // Icon mapping - same as PopularCategoriesManagement
  const iconComponents = {
    'Smartphone': Smartphone,
    'Laptop': Laptop,
    'Monitor': Monitor,
    'Tv': Tv,
    'Watch': Watch,
    'Camera': Camera,
    'Headphones': Headphones,
    'Gamepad': Gamepad,
    'Home': Home,
    'Zap': Zap,
    'ShoppingBag': ShoppingBag,
    'Coffee': Coffee,
    'Microwave': Microwave,
    'Fan': Fan,
    'Wind': Wind,
    'Snowflake': Snowflake,
    'Shirt': Shirt,
    'Heart': Heart,
    'Book': Book,
    'Music': Music,
    'Car': Car,
    'Bike': Bike,
    'Dumbbell': Dumbbell,
    'Baby': Baby,
    'Pill': Pill,
    'Leaf': Leaf,
    'Palette': Palette,
    'Wrench': Wrench,
    'Hammer': Hammer,
    'Lightbulb': Lightbulb,
    'Wifi': Wifi,
    'Speaker': Speaker
  };

  const iconOptions = [
    { name: 'Smartphone', label: 'Смартфони' },
    { name: 'Laptop', label: 'Ноутбуки' },
    { name: 'Monitor', label: 'Монітори' },
    { name: 'Tv', label: 'Телевізори' },
    { name: 'Watch', label: 'Годинники' },
    { name: 'Camera', label: 'Камери' },
    { name: 'Headphones', label: 'Навушники' },
    { name: 'Gamepad', label: 'Ігри' },
    { name: 'Home', label: 'Для дому' },
    { name: 'Zap', label: 'Електроніка' },
    { name: 'ShoppingBag', label: 'Покупки' },
    { name: 'Coffee', label: 'Кава' },
    { name: 'Microwave', label: 'Мікрохвильовка' },
    { name: 'Fan', label: 'Вентилятор' },
    { name: 'Wind', label: 'Кондиціонер' },
    { name: 'Snowflake', label: 'Холодильник' },
    { name: 'Shirt', label: 'Одяг' },
    { name: 'Heart', label: 'Здоров\'я' },
    { name: 'Book', label: 'Книги' },
    { name: 'Music', label: 'Музика' },
    { name: 'Car', label: 'Авто' },
    { name: 'Bike', label: 'Велосипеди' },
    { name: 'Dumbbell', label: 'Спорт' },
    { name: 'Baby', label: 'Дитяче' },
    { name: 'Pill', label: 'Медицина' },
    { name: 'Leaf', label: 'Еко' },
    { name: 'Palette', label: 'Творчість' },
    { name: 'Wrench', label: 'Інструменти' },
    { name: 'Hammer', label: 'Будівництво' },
    { name: 'Lightbulb', label: 'Освітлення' },
    { name: 'Wifi', label: 'WiFi' },
    { name: 'Speaker', label: 'Акустика' }
  ];

  const filteredIcons = iconOptions.filter(icon =>
    icon.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
    icon.name.toLowerCase().includes(iconSearch.toLowerCase())
  );
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsEditing(true);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      parent_id: category.parent_id || null,
      icon: category.icon || 'Smartphone'
    });
    
    // Get products in this category
    const categoryProducts = products.filter(p => p.category_id === category.id);
    setSelectedProducts(categoryProducts.map(p => p.id));
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsEditing(true);
    setFormData({
      name: '',
      slug: '',
      parent_id: null,
      icon: 'Smartphone'
    });
    setSelectedProducts([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parent_id: null,
      icon: 'Smartphone'
    });
    setSelectedProducts([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.name) {
        toast.error(t('enterCategoryName') || 'Please enter category name');
        return;
      }

      let categoryId;
      
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData);
        categoryId = editingCategory.id;
        toast.success(t('categoryUpdated'));
      } else {
        const response = await categoriesAPI.create(formData);
        categoryId = response.data.id;
        toast.success(t('categoryCreated'));
      }

      // Update products with this category
      const updatePromises = [];
      
      // Add category to selected products
      selectedProducts.forEach(productId => {
        updatePromises.push(
          productsAPI.update(productId, {
            category_id: categoryId,
            category_name: formData.name
          })
        );
      });

      // Remove category from unselected products that were in this category
      if (editingCategory) {
        products
          .filter(p => p.category_id === editingCategory.id && !selectedProducts.includes(p.id))
          .forEach(product => {
            updatePromises.push(
              productsAPI.update(product.id, {
                category_id: '',
                category_name: ''
              })
            );
          });
      }

      await Promise.all(updatePromises);
      
      fetchCategories();
      fetchProducts();
      handleCancel();
    } catch (error) {
      console.error('Failed to save category:', error);
      toast.error(`Error: ${error.message || 'Failed to save category'}`);
    }
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await categoriesAPI.delete(categoryId);
        toast.success('Category deleted successfully!');
        fetchCategories();
      } catch (error) {
        console.error('Failed to delete category:', error);
        toast.error('Error deleting category');
      }
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isEditing) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">
              {editingCategory ? t('editCategory') : t('addCategory')}
            </h2>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                💡 Как создать многоуровневый каталог (как на Foxtrot):
              </p>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li><strong>Главная категория:</strong> Создайте без родителя (например: "Электроника")</li>
                <li><strong>Подкатегория:</strong> Создайте с родителем (например: "Смартфоны" под "Электроника")</li>
                <li><strong>Результат:</strong> При наведении на "Электроника" справа появится submenu с "Смартфоны"</li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Name */}
            <div>
              <Label htmlFor="name">{t('categoryName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setFormData({
                    ...formData,
                    name,
                    slug: name.toLowerCase().replace(/\s+/g, '-')
                  });
                }}
                required
                placeholder={t('categoryName')}
              />
            </div>

            {/* Slug */}
            <div>
              <Label htmlFor="slug">{t('slug')} (auto-generated)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={t('slug')}
              />
            </div>

            {/* Parent Category - ДЕРЕВО КАТЕГОРИЙ */}
            <div className="border-2 border-blue-200 rounded-xl p-5 bg-blue-50">
              <Label htmlFor="parent" className="text-lg font-bold text-blue-900 mb-2 block">
                🌳 Родительская категория (для создания дерева как на Foxtrot)
              </Label>
              <p className="text-sm text-gray-700 mb-4">
                <strong>Оставьте пустым</strong> для создания <strong>главной категории</strong> (например: "Электроника", "Для дома").
                <br />
                <strong>Выберите родителя</strong> для создания <strong>подкатегории</strong> (например: "Смартфоны" под "Электроника").
              </p>
              <select
                id="parent"
                value={formData.parent_id || ''}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value || null })}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
              >
                <option value="" className="font-bold">
                  ➡️ Главная категория (без родителя)
                </option>
                <optgroup label="📁 Выберите родительскую категорию:">
                  {categories
                    .filter(c => !c.parent_id && (!editingCategory || c.id !== editingCategory.id))
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        📂 {category.name}
                      </option>
                    ))}
                </optgroup>
              </select>
              {formData.parent_id && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Эта категория будет <strong>подкатегорией</strong> категории:{' '}
                    <strong>{categories.find(c => c.id === formData.parent_id)?.name}</strong>
                  </p>
                </div>
              )}
              {!formData.parent_id && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ Эта категория будет <strong>главной</strong> (верхнего уровня)
                  </p>
                </div>
              )}
            </div>

            {/* Icon Selection */}
            <div>
              <Label className="text-lg font-semibold mb-3 block">{t('selectIcon')} *</Label>
              <p className="text-xs text-gray-500 mb-3">{t('selectIcon')}</p>
              
              <div className="mb-3">
                <Input
                  placeholder={t('iconSearch')}
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl max-h-96 overflow-y-auto border-2 border-blue-200">
                {filteredIcons.map((iconOption) => {
                  const IconComponent = iconComponents[iconOption.name];
                  return (
                    <button
                      key={iconOption.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: iconOption.name })}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                        formData.icon === iconOption.name
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 scale-105 shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-blue-100 hover:scale-105 shadow-md'
                      }`}
                      title={iconOption.label}
                    >
                      <IconComponent className="w-8 h-8 mb-1" />
                      <span className="text-[9px] font-medium text-center leading-tight">
                        {iconOption.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {filteredIcons.length === 0 && (
                <p className="text-center text-gray-500 py-8">{t('noIconsFound')}</p>
              )}

              <div className="mt-4 p-4 bg-white rounded-xl border-2 border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                    {(() => {
                      const IconComponent = iconComponents[formData.icon];
                      return IconComponent ? <IconComponent className="w-10 h-10 text-blue-600" /> : null;
                    })()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">{t('selectedIcon')}</p>
                    <p className="text-lg font-bold text-gray-800">
                      {iconOptions.find(i => i.name === formData.icon)?.label || formData.icon}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Selection */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <Label>Assign Products to Category</Label>
                <span className="text-sm text-gray-500">
                  {selectedProducts.length} product(s) selected
                </span>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Products List */}
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                {filteredProducts.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {/* Product Image */}
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        
                        {/* Product Info */}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{product.title}</p>
                          <p className="text-sm text-gray-500">
                            ${product.price} • Stock: {product.stock_level}
                            {product.category_name && product.category_id !== editingCategory?.id && (
                              <span className="ml-2 text-orange-600">
                                (Currently in: {product.category_name})
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Plus Icon */}
                        <Plus className={`w-5 h-5 transition-colors ${
                          selectedProducts.includes(product.id)
                            ? 'text-green-600'
                            : 'text-gray-400'
                        }`} />
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No products found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingCategory ? t('updateCategory') : t('createCategory')}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="w-4 h-4 mr-2" />
                {t('cancel')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('categoryManagement')}</h2>
        <Button onClick={handleAddNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('addCategory')}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('slug')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('products')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.filter(c => !c.parent_id).map((category) => {
                const categoryProducts = products.filter(p => p.category_id === category.id);
                const subcategories = categories.filter(c => c.parent_id === category.id);
                
                return (
                  <React.Fragment key={category.id}>
                    {/* Parent Category */}
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Category Icon */}
                          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            {(() => {
                              const IconComponent = iconComponents[category.icon || 'Smartphone'];
                              return IconComponent ? <IconComponent className="w-7 h-7 text-blue-600" /> : <ShoppingBag className="w-7 h-7 text-gray-400" />;
                            })()}
                          </div>
                          
                          <div>
                            <p className="font-bold text-gray-900">{category.name}</p>
                            {subcategories.length > 0 && (
                              <p className="text-sm text-blue-600 mt-1">
                                📁 {subcategories.length} {subcategories.length === 1 ? 'subcategory' : 'subcategories'}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {category.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {categoryProducts.length} products
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(null);
                            setIsEditing(true);
                            setFormData({
                              name: '',
                              slug: '',
                              parent_id: category.id,
                              icon: 'Smartphone'
                            });
                            setSelectedProducts([]);
                          }}
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Добавить подкатегорию"
                        >
                          <Plus className="w-4 h-4" />
                          Подкатегория
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(category)}
                          className="inline-flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </td>
                    </tr>

                    {/* Subcategories */}
                    {subcategories.map((subcategory) => {
                      const subcategoryProducts = products.filter(p => p.category_id === subcategory.id);
                      
                      return (
                        <tr key={subcategory.id} className="bg-blue-50 hover:bg-blue-100 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3 pl-8">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                {(() => {
                                  const IconComponent = iconComponents[subcategory.icon || 'Smartphone'];
                                  return IconComponent ? <IconComponent className="w-5 h-5 text-blue-600" /> : <ShoppingBag className="w-5 h-5 text-gray-400" />;
                                })()}
                              </div>
                              
                              <div>
                                <p className="text-sm font-medium text-gray-800">↳ {subcategory.name}</p>
                                <p className="text-xs text-gray-500">
                                  Child of: {category.name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">
                            {subcategory.slug}
                          </td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-900">
                              {subcategoryProducts.length} products
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(subcategory)}
                              className="inline-flex items-center gap-1 text-xs"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(subcategory.id)}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
