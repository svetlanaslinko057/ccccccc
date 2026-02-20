import React, { useState } from 'react';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

/**
 * Specifications Editor Component
 * 
 * Allows adding specifications with text and images
 * Each specification has:
 * - Title
 * - Description (text)
 * - Image (optional)
 */
const SpecificationsEditor = ({ specifications = [], onChange }) => {
  const [specs, setSpecs] = useState(
    specifications.length > 0 
      ? specifications 
      : [{ title: '', description: '', image: '' }]
  );

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
    onChange(newSpecs);
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('Image size must be less than 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      handleSpecChange(index, 'image', reader.result);
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const addSpecification = () => {
    const newSpecs = [...specs, { title: '', description: '', image: '' }];
    setSpecs(newSpecs);
    onChange(newSpecs);
  };

  const removeSpecification = (index) => {
    if (specs.length <= 1) return;
    const newSpecs = specs.filter((_, i) => i !== index);
    setSpecs(newSpecs);
    onChange(newSpecs);
  };

  return (
    <div className="space-y-6">
      {specs.map((spec, index) => (
        <div key={index} className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 relative">
          {/* Remove Button */}
          {specs.length > 1 && (
            <button
              type="button"
              onClick={() => removeSpecification(index)}
              className="absolute top-4 right-4 p-1 text-red-500 hover:bg-red-50 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor={`spec-title-${index}`}>
                Specification Title *
              </Label>
              <Input
                id={`spec-title-${index}`}
                value={spec.title}
                onChange={(e) => handleSpecChange(index, 'title', e.target.value)}
                placeholder="e.g., Display"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor={`spec-desc-${index}`}>
                Description *
              </Label>
              <textarea
                id={`spec-desc-${index}`}
                value={spec.description}
                onChange={(e) => handleSpecChange(index, 'description', e.target.value)}
                placeholder="Describe this specification..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>Image (Optional)</Label>
              
              {spec.image ? (
                <div className="mt-2">
                  <div className="relative inline-block">
                    <img
                      src={spec.image}
                      alt={spec.title}
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleSpecChange(index, 'image', '')}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(index, e)}
                    className="hidden"
                    id={`spec-image-${index}`}
                  />
                  <label
                    htmlFor={`spec-image-${index}`}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">
                      Click to upload image
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF up to 3MB
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add Specification Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addSpecification}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Specification
      </Button>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Add specifications with descriptions and optional images.
          For example: "Display" with description and a photo of the screen.
        </p>
      </div>
    </div>
  );
};

export default SpecificationsEditor;
