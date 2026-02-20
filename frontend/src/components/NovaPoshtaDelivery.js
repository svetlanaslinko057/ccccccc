import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Package, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const NovaPoshtaDelivery = ({ onAddressChange, initialCity, initialWarehouse }) => {
  const { t } = useLanguage();
  const [cityQuery, setCityQuery] = useState(initialCity || '');
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const [warehouseNumber, setWarehouseNumber] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(initialWarehouse || null);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  
  const cityInputRef = useRef(null);
  const warehouseInputRef = useRef(null);

  // Search cities when user types
  useEffect(() => {
    if (cityQuery.length < 2) {
      setCities([]);
      setShowCityDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/novaposhta/cities?query=${encodeURIComponent(cityQuery)}&limit=10`
        );
        const data = await response.json();
        
        if (data.success) {
          setCities(data.data || []);
          setShowCityDropdown(true);
        }
      } catch (error) {
        console.error('Error searching cities:', error);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [cityQuery]);

  // Search warehouses when user types warehouse number
  useEffect(() => {
    if (!selectedCity || warehouseNumber.length === 0) {
      setWarehouses([]);
      setShowWarehouseDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoadingWarehouses(true);
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/novaposhta/warehouses?city_ref=${selectedCity.ref}&number=${warehouseNumber}`
        );
        const data = await response.json();
        
        if (data.success) {
          setWarehouses(data.data || []);
          setShowWarehouseDropdown(true);
        }
      } catch (error) {
        console.error('Error searching warehouses:', error);
      } finally {
        setLoadingWarehouses(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [selectedCity, warehouseNumber]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCityQuery(city.city_name);
    setShowCityDropdown(false);
    setWarehouseNumber('');
    setSelectedWarehouse(null);
    
    // Notify parent
    if (onAddressChange) {
      onAddressChange({
        city: city.city_name,
        cityRef: city.ref,
        cityDescription: city.description,
        warehouse: null
      });
    }
  };

  const handleWarehouseSelect = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseNumber(warehouse.number);
    setShowWarehouseDropdown(false);
    
    // Notify parent
    if (onAddressChange) {
      onAddressChange({
        city: selectedCity.city_name,
        cityRef: selectedCity.ref,
        cityDescription: selectedCity.description,
        warehouse: {
          ref: warehouse.ref,
          number: warehouse.number,
          address: warehouse.short_address,
          description: warehouse.description
        }
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityInputRef.current && !cityInputRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
      if (warehouseInputRef.current && !warehouseInputRef.current.contains(event.target)) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* City Search */}
      <div className="relative" ref={cityInputRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          {t('cityLabel')}
        </label>
        <div className="relative">
          <input
            type="text"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setSelectedCity(null);
            }}
            onFocus={() => {
              if (cities.length > 0) setShowCityDropdown(true);
            }}
            placeholder={t('startTypingCity')}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
        </div>
        
        {/* City Dropdown */}
        {showCityDropdown && cities.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {cities.map((city) => (
              <div
                key={city.ref}
                onClick={() => handleCitySelect(city)}
                className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{city.city_name}</div>
                <div className="text-sm text-gray-600">{city.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Warehouse Search */}
      {selectedCity && (
        <div className="relative" ref={warehouseInputRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="inline w-4 h-4 mr-1" />
            {t('warehouseNumberLabel')}
          </label>
          <div className="relative">
            <input
              type="text"
              value={warehouseNumber}
              onChange={(e) => {
                setWarehouseNumber(e.target.value);
                setSelectedWarehouse(null);
              }}
              onFocus={() => {
                if (warehouses.length > 0) setShowWarehouseDropdown(true);
              }}
              placeholder={t('enterWarehouseNumber')}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {loadingWarehouses && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          
          {/* Warehouse Dropdown */}
          {showWarehouseDropdown && warehouses.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.ref}
                  onClick={() => handleWarehouseSelect(warehouse)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-blue-600">
                        {t('warehouseNo')}{warehouse.number}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        {warehouse.short_address}
                      </div>
                      {warehouse.category_of_warehouse && (
                        <div className="text-xs text-gray-500 mt-1">
                          {warehouse.category_of_warehouse}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {warehouses.length === 0 && !loadingWarehouses && warehouseNumber && (
                <div className="px-4 py-3 text-gray-500 text-center">
                  {t('warehouseNotFound')}
                </div>
              )}
            </div>
          )}
          
          {/* Selected Warehouse Display */}
          {selectedWarehouse && !showWarehouseDropdown && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Package className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-green-800">
                    {t('warehouseNo')}{selectedWarehouse.number}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    {selectedWarehouse.short_address}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NovaPoshtaDelivery;
