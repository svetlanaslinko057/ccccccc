import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { categoriesAPI, productsAPI } from '../utils/api';
import ProductCardCompact from '../components/ProductCardCompact';
import CategorySidebar from '../components/CategorySidebar';
import HeroBanner from '../components/HeroBanner';
import PopularCategories from '../components/PopularCategories';
import ActualOffers from '../components/ActualOffers';
import CustomSection from '../components/CustomSection';
import PaymentDeliveryInfo from '../components/PaymentDeliveryInfo';
import TestimonialsSection from '../components/TestimonialsSection';
import SEO from '../components/SEO';
import FeaturedReviews from '../components/FeaturedReviews';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [customSections, setCustomSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, featuredRes, sectionsRes] = await Promise.all([
        categoriesAPI.getAll(),
        productsAPI.getAll({ limit: 12, sort_by: 'popularity' }),
        axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/custom-sections`),
      ]);
      
      // Получаем бестселлеры
      const bestsellersRes = await productsAPI.getAll({ limit: 12 });
      const bestsellersData = bestsellersRes.data.filter(p => p.is_bestseller) || bestsellersRes.data.slice(0, 8);
      
      setCategories(categoriesRes.data);
      setFeaturedProducts(featuredRes.data);
      setBestsellers(bestsellersData);
      setCustomSections(sectionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    navigate(`/products?category=${categoryId}`);
  };

  return (
    <>
      <SEO 
        title="Y-store - Інтернет-магазин електроніки №1 в Україні | Смартфони, Ноутбуки, Техніка"
        description="Y-store - найкращий інтернет-магазин електроніки в Україні. ✓ Смартфони ✓ Ноутбуки ✓ Побутова техніка за найкращими цінами. Швидка доставка по всій Україні. Офіційна гарантія!"
        keywords="інтернет магазин електроніки, купити смартфон україна, ноутбуки київ, побутова техніка онлайн, телевізори купити, техніка для дому, y-store"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
        <div className="container-main py-8">
          <div className="flex gap-8">
            {/* Left Sidebar - Categories - только на десктопе */}
            <div className="hidden lg:block">
              <CategorySidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          {/* Right Content */}
          <div className="flex-1">
            {/* Hero Banner */}
            <div className="transform hover:scale-[1.01] transition-transform duration-300">
              <HeroBanner />
            </div>

            {/* Featured Products - HIDDEN (старая логика, заменена на CustomSections) */}
            <section className="mt-12" style={{ display: 'none' }}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {t('featuredProducts')}
                  </h2>
                  <p className="text-gray-600 mt-2">Найкращі пропозиції для вас</p>
                </div>
                <Link 
                  to="/products?sort_by=popularity"
                  className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  {t('viewAll')}
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                    <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-4 border-purple-400 opacity-20"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-7">
                  {featuredProducts.slice(0, 12).map((product, index) => (
                    <div 
                      key={product.id} 
                      className="animate-fadeIn"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ProductCardCompact product={product} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Popular Categories - под товарами */}
            <div className="mt-8">
              <PopularCategories categories={categories} />
            </div>

            {/* Actual Offers - актуальні пропозиції */}
            <div className="mt-8">
              <ActualOffers />
            </div>

            {/* Custom Sections - Хіти продажу, Новинки, Популярні та інші */}
            {customSections.map((section) => (
              <div key={section.id} className="mt-8">
                <CustomSection sectionData={section} />
              </div>
            ))}

            {/* Bestsellers - Хіти продажу (старая версия - можно убрать если используем CustomSection) */}
            <section className="mt-12" style={{ display: 'none' }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#121212]">🔥 Хіти продажу</h2>
                <Link 
                  to="/products?bestsellers=true"
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  {t('viewAll')}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071E3]"></div>
                </div>
              ) : bestsellers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
                  <p className="text-gray-500">Хітів продажу поки немає. Додайте товари в админці.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {bestsellers.slice(0, 12).map((product) => (
                    <ProductCardCompact key={product.id} product={product} />
                  ))}
                </div>
              )}
            </section>

            {/* Testimonials - ОДИН РАЗ */}
            <section className="mt-12">
              <TestimonialsSection />
            </section>
          </div>
        </div>
      </div>

      {/* Featured Reviews Section */}
      <FeaturedReviews />

      {/* Payment & Delivery Info Section */}
      <PaymentDeliveryInfo />
    </div>
    </>
  );
};

export default Home;
