import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ScrollReveal from './ScrollReveal';
import { 
  Smartphone, Laptop, Monitor, Tv, Watch, Camera, Headphones, Gamepad,
  Home, Zap, ShoppingBag, Coffee, Microwave, Fan, Wind, Snowflake,
  Shirt, Heart, Book, Music, Car, Bike, Dumbbell, Baby,
  Pill, Leaf, Palette, Wrench, Hammer, Lightbulb, Wifi, Speaker
} from 'lucide-react';

const PopularCategories = ({ categories }) => {
  const navigate = useNavigate();
  const [popularCategories, setPopularCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Icon mapping
  const iconComponents = {
    'Smartphone': Smartphone, 'Laptop': Laptop, 'Monitor': Monitor, 'Tv': Tv,
    'Watch': Watch, 'Camera': Camera, 'Headphones': Headphones, 'Gamepad': Gamepad,
    'Home': Home, 'Zap': Zap, 'ShoppingBag': ShoppingBag, 'Coffee': Coffee,
    'Microwave': Microwave, 'Fan': Fan, 'Wind': Wind, 'Snowflake': Snowflake,
    'Shirt': Shirt, 'Heart': Heart, 'Book': Book, 'Music': Music,
    'Car': Car, 'Bike': Bike, 'Dumbbell': Dumbbell, 'Baby': Baby,
    'Pill': Pill, 'Leaf': Leaf, 'Palette': Palette, 'Wrench': Wrench,
    'Hammer': Hammer, 'Lightbulb': Lightbulb, 'Wifi': Wifi, 'Speaker': Speaker
  };

  useEffect(() => {
    fetchPopularCategories();
  }, []);

  const fetchPopularCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/popular-categories`);
      
      if (response.data.length > 0) {
        setPopularCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch popular categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    // Если указан category_id, используем его для фильтрации
    if (category.category_id) {
      navigate(`/products?category_id=${category.category_id}`);
    } else {
      // Иначе ищем категорию по имени
      const matchedCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(category.name.toLowerCase().slice(0, 5))
      );
      
      if (matchedCategory) {
        navigate(`/products?category_id=${matchedCategory.id}`);
      } else {
        navigate('/products');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white py-6 rounded-xl border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (popularCategories.length === 0) {
    return null;
  }

  return (
    <ScrollReveal>
      <div className="bg-gradient-to-br from-white to-blue-50 py-8 rounded-3xl shadow-lg border border-blue-100">
        <div className="mb-6 px-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Популярні категорії
          </h2>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4 px-6">
          {popularCategories.map((category, index) => {
            const IconComponent = iconComponents[category.icon];
            return (
              <button
                key={category.id || index}
                onClick={() => handleCategoryClick(category)}
                className="group flex flex-col items-center justify-center p-4 bg-white rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 hover:border-blue-300"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 group-hover:scale-110 transition-transform duration-300">
                  {category.image_url ? (
                    <img 
                      src={category.image_url} 
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : IconComponent ? (
                    <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-blue-600 group-hover:text-blue-700 transition-colors" />
                  ) : category.icon ? (
                    <span className="text-4xl md:text-5xl">{category.icon}</span>
                  ) : (
                    <ShoppingBag className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                  )}
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-700 text-center leading-tight uppercase group-hover:text-blue-600 transition-colors">
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </ScrollReveal>
  );
};

export default PopularCategories;
