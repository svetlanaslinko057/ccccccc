# Image Upload Guide - Admin Panel

## Overview
Product images can now be uploaded in two ways:
1. **URL Method** - Paste image URL from internet
2. **File Upload** - Upload image file from your computer

---

## How to Add Product with Images

### Step 1: Access Admin Panel
1. Navigate to `/admin`
2. Click on **"Products"** tab
3. Click **"Add Product"** button

### Step 2: Fill Product Information
- **Product Title** (required)
- **Category** (required)
- **Price** (required)
- **Stock Quantity** (required)

### Step 3: Upload Images

#### Method A: Using URL
1. Select **"URL"** tab
2. Paste image URL in the input field
3. Image preview will appear automatically
4. Click **"Add Another Image"** for more images

**Example URL:**
```
https://images.unsplash.com/photo-1517336714731-489689fd1ca8
```

#### Method B: Upload from Computer
1. Select **"Upload File"** tab
2. Click **"Choose Image"** button
3. Select image file from your computer
4. Image will be converted and preview shown
5. Click **"Add Another Image"** for more images

**File Requirements:**
- Format: JPG, PNG, GIF, WebP
- Max size: 5MB per image
- Recommended: 800x800px or larger

### Step 4: Add Description
Use the HTML editor to add:
- Product description text
- Additional images in description
- Links, lists, headings

### Step 5: Save Product
Click **"Create Product"** button

---

## Technical Details

### Image Storage
- **URL images**: Stored as is
- **Uploaded images**: Converted to Base64 and stored in database

### Base64 Conversion
When you upload a file:
1. File is read from computer
2. Converted to Base64 string
3. Stored in database with product
4. Displayed directly in gallery

**Example Base64:**
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
```

### Image Array Structure
```javascript
{
  "images": [
    "https://example.com/image1.jpg",  // URL
    "data:image/jpeg;base64,/9j/...",  // Base64
    "https://example.com/image2.jpg"   // URL
  ]
}
```

---

## Best Practices

### Image Quality
- Use high-resolution images (at least 800x800px)
- Optimize images before upload (use tools like TinyPNG)
- Keep file size under 1MB for faster loading

### Gallery Order
- **First image** = Main product image (shown in cards)
- **Remaining images** = Gallery images (shown in detail page)
- Drag to reorder (TODO: implement drag-drop)

### Multiple Images
- Add 3-5 images per product
- Show product from different angles
- Include detail shots
- Show product in use

---

## Troubleshooting

### Issue: Image Not Displaying
**Solution:**
- Check if URL is accessible
- Verify image format is supported
- Try uploading instead of URL

### Issue: File Too Large
**Solution:**
- Compress image before upload
- Use online tools: TinyPNG, Squoosh
- Resize to 1200px maximum dimension

### Issue: Upload Button Not Working
**Solution:**
- Check file format (must be image)
- Check file size (must be under 5MB)
- Try different browser
- Check browser console for errors

### Issue: Base64 Images Slow
**Solution:**
- Use URLs for large images
- Compress images before upload
- Consider implementing cloud storage (S3, Cloudinary)

---

## Future Enhancements

### Planned Features
1. **Drag & Drop** - Drag images to reorder
2. **Image Cropper** - Crop images before upload
3. **Cloud Storage** - Upload to S3/Cloudinary
4. **Bulk Upload** - Upload multiple files at once
5. **Image Optimization** - Auto-compress on upload
6. **Progress Bar** - Show upload progress
7. **Image Library** - Reuse previously uploaded images

---

## API Integration

### Upload Endpoint (Future)
```python
@app.post("/api/upload-image")
async def upload_image(file: UploadFile):
    # Save file to storage
    # Return public URL
    return {"url": "https://cdn.example.com/image.jpg"}
```

### Usage in Frontend
```javascript
const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  return data.url;
};
```

---

## Component Documentation

### ImageUploader Component

**Location:** `/app/frontend/src/components/admin/ImageUploader.js`

**Props:**
```javascript
{
  images: string[],      // Array of image URLs or Base64
  onChange: function     // Callback with updated images array
}
```

**Usage:**
```jsx
<ImageUploader
  images={formData.images}
  onChange={(newImages) => setFormData({ ...formData, images: newImages })}
/>
```

**Features:**
- Toggle between URL and File upload
- Image preview
- Add/remove images
- File validation
- Base64 conversion
- Helpful tips

---

## Security Considerations

### Base64 Storage
**Pros:**
- No separate file storage needed
- Simple implementation
- Works immediately

**Cons:**
- Increases database size (~33% larger than binary)
- Slower to transfer
- Not ideal for many/large images

### Recommendations for Production
1. Implement cloud storage (AWS S3, Cloudinary, etc.)
2. Store only URLs in database
3. Implement image CDN for fast delivery
4. Add image processing (resize, optimize)
5. Implement access control for uploads

---

## Examples

### Example 1: Add Product with URL Images
```javascript
{
  "title": "MacBook Pro 16",
  "category_id": "abc123",
  "price": 2499.99,
  "stock_level": 10,
  "images": [
    "https://example.com/macbook-front.jpg",
    "https://example.com/macbook-side.jpg",
    "https://example.com/macbook-screen.jpg"
  ]
}
```

### Example 2: Add Product with Uploaded Images
```javascript
{
  "title": "MacBook Pro 16",
  "category_id": "abc123",
  "price": 2499.99,
  "stock_level": 10,
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,iVBORw0KGgoAAAA...",
    "https://example.com/macbook-manual.pdf"
  ]
}
```

### Example 3: Mixed URLs and Uploads
```javascript
{
  "images": [
    "https://example.com/official-image.jpg",    // From manufacturer
    "data:image/jpeg;base64,/9j/...",            // Your own photo
    "data:image/png;base64,iVBORw0...",          // Screenshot
    "https://example.com/lifestyle.jpg"          // Lifestyle shot
  ]
}
```

---

## Support

For questions or issues:
1. Check this guide
2. Verify file format and size
3. Check browser console for errors
4. Test with different images
5. Contact developer if issue persists

---

Last Updated: December 2024
