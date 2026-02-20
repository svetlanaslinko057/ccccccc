import React from 'react';
import { RotateCcw, CheckCircle, XCircle, Package, AlertTriangle } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

const ExchangeReturn = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <ScrollReveal animation="fadeInUp">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                <RotateCcw className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Обмін і повернення
            </h1>
            <p className="text-xl text-gray-600">
              Ваше задоволення - наш пріоритет. Ми гарантуємо якість!
            </p>
          </div>
        </ScrollReveal>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12 space-y-10">
          {/* Return Conditions */}
          <ScrollReveal animation="fadeInUp">
            <section className="border-l-4 border-green-600 pl-6">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">1</span>
                Умови повернення
              </h2>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 mb-6">
                <h3 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
                  <CheckCircle className="w-7 h-7" />
                  Ви маєте право повернути товар протягом 14 днів
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Відповідно до Закону України "Про захист прав споживачів", ви можете повернути непродовольчий товар належної якості протягом 14 календарних днів, не враховуючи дня купівлі.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-xl">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Товар можна повернути, якщо:
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <span>Збережено товарний вигляд і упаковку</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <span>Наявні пломби, ярлики і бирки</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <span>Товар не використовувався</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <span>Є розрахунковий документ (чек)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-red-50 rounded-2xl p-6 hover:shadow-lg transition-all">
                  <h4 className="font-bold text-red-900 mb-4 flex items-center gap-2 text-xl">
                    <XCircle className="w-6 h-6 text-red-600" />
                    Не підлягають поверненню:
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <span>Товари індивідуального користування (білизна, косметика)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <span>Товари з порушеною упаковкою</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <span>Товари зі слідами використання</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      <span>Товари на замовлення (індивідуальні характеристики)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* How to Return */}
          <ScrollReveal animation="fadeInUp" delay={100}>
            <section className="border-l-4 border-blue-600 pl-6">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">2</span>
                Як повернути товар?
              </h2>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-l-4 border-blue-600">
                  <h3 className="text-2xl font-bold text-blue-900 mb-3">Крок 1: Зв'яжіться з нами</h3>
                  <p className="text-gray-700 text-lg">Телефонуйте за номером <strong className="text-blue-600">050-247-41-61</strong> або пишіть на <strong className="text-blue-600">support@y-store.in.ua</strong></p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-l-4 border-purple-600">
                  <h3 className="text-2xl font-bold text-purple-900 mb-3">Крок 2: Підготуйте товар</h3>
                  <p className="text-gray-700 text-lg">Упакуйте товар у оригінальну упаковку зі всіма ярликами та документами</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-l-4 border-green-600">
                  <h3 className="text-2xl font-bold text-green-900 mb-3">Крок 3: Відправте товар</h3>
                  <p className="text-gray-700 text-lg">Надішліть товар на нашу адресу через Нову Пошту (вартість доставки оплачує покупець)</p>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border-l-4 border-orange-600">
                  <h3 className="text-2xl font-bold text-orange-900 mb-3">Крок 4: Отримайте кошти</h3>
                  <p className="text-gray-700 text-lg">Протягом 30 днів після отримання товару ми повернемо вам кошти на картку або рахунок</p>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Exchange */}
          <ScrollReveal animation="fadeInUp" delay={150}>
            <section className="border-l-4 border-purple-600 pl-6">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">3</span>
                Обмін товару
              </h2>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Ви можете обміняти товар на аналогічний іншого розміру, кольору або моделі протягом 14 днів.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    <p className="text-gray-700"><strong>Безкоштовний обмін</strong> при наявності товару на складі</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    <p className="text-gray-700"><strong>Доплата різниці</strong> якщо новий товар дорожчий</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
                    <p className="text-gray-700"><strong>Повернення різниці</strong> якщо новий товар дешевший</p>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Warranty */}
          <ScrollReveal animation="fadeInUp" delay={200}>
            <section className="border-l-4 border-orange-600 pl-6">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">4</span>
                Гарантія
              </h2>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border-2 border-orange-200">
                <p className="text-gray-700 text-lg leading-relaxed mb-6">
                  Усі товари мають гарантію виробника. Термін гарантії вказаний у гарантійному талоні.
                </p>
                <div className="bg-white rounded-xl p-6">
                  <h4 className="font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6" />
                    При виявленні дефектів протягом гарантійного терміну:
                  </h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <span>Безкоштовний ремонт</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <span>Заміна на аналогічний товар</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                      <span>Повернення коштів (при неможливості ремонту)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Contact Banner */}
          <ScrollReveal animation="scaleIn">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white text-center">
              <h3 className="text-3xl font-extrabold mb-4">Є питання?</h3>
              <p className="text-xl mb-6">Наша служба підтримки завжди готова допомогти!</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <a href="tel:+380502474161" className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
                  📞 050-247-41-61
                </a>
                <a href="mailto:support@y-store.in.ua" className="bg-white/20 backdrop-blur-lg px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-transform">
                  ✉️ support@y-store.in.ua
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default ExchangeReturn;
