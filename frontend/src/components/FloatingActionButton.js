import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, X } from 'lucide-react';
import Tooltip from './Tooltip';

const FloatingActionButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: MessageCircle,
      label: 'Написати в чат',
      color: 'from-blue-600 to-cyan-600',
      action: () => {
        // Open chatbot or chat
        console.log('Open chat');
      },
    },
    {
      icon: Phone,
      label: 'Зателефонувати',
      color: 'from-green-600 to-emerald-600',
      action: () => {
        window.location.href = 'tel:+380502474161';
      },
    },
    {
      icon: Mail,
      label: 'Написати email',
      color: 'from-purple-600 to-pink-600',
      action: () => {
        window.location.href = 'mailto:support@y-store.com';
      },
    },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-40">
      {/* Action Buttons */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-4 animate-fadeIn">
          {actions.map((item, index) => (
            <Tooltip key={index} text={item.label} position="left">
              <button
                onClick={item.action}
                className={`bg-gradient-to-r ${item.color} text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 animate-slideInRight`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon className="w-6 h-6" />
              </button>
            </Tooltip>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-5 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
      </button>
    </div>
  );
};

export default FloatingActionButton;
