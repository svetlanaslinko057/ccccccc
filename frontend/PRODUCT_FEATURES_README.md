# Product Page Features - Developer Documentation

## Overview
This document describes the product page features including gallery, comments, and rich text editor for admin panel.

## Features

### 1. Product Image Gallery (`ProductImageGallery.js`)

**Location:** `/app/frontend/src/components/product/ProductImageGallery.js`

**Features:**
- Vertical thumbnail navigation (left side)
- Large main image display
- Support for multiple images
- Support for video content
- Discount badge display
- Quick info badges (Fast Delivery, In Stock)

**Props:**
```javascript
{
  images: string[],      // Array of image URLs
  videos: string[],      // Array of video URLs
  productTitle: string,  // Product title for alt text
  discount: number       // Discount percentage (0-100)
}
```

**Usage Example:**
```jsx
<ProductImageGallery 
  images={['url1.jpg', 'url2.jpg']}
  videos={['video1.mp4']}
  productTitle="MacBook Pro 16"
  discount={15}
/>
```

---

### 2. Product Comments (`ProductComments.js`)

**Location:** `/app/frontend/src/components/product/ProductComments.js`

**Features:**
- Add new comments (authenticated users only)
- Like and heart reactions
- User avatars with gradient
- Timestamp display
- Real-time reaction updates

**Props:**
```javascript
{
  productId: string,           // Product ID
  isAuthenticated: boolean,    // User auth status
  onLoginRequired: function    // Callback when login needed
}
```

**API Integration Required:**
- `POST /api/comments` - Create new comment
- `GET /api/comments/:productId` - Get product comments
- `POST /api/comments/:id/react` - Add/remove reaction

**Mock Data Structure:**
```javascript
{
  id: number,
  user_name: string,
  comment: string,
  created_at: string (ISO),
  reactions: {
    likes: number,
    hearts: number
  },
  user_reacted: boolean
}
```

---

### 3. Rich Text Editor (`RichTextEditor.js`)

**Location:** `/app/frontend/src/components/admin/RichTextEditor.js`

**Technology:** React Quill

**Features:**
- Headers (H1-H6)
- Text formatting (bold, italic, underline, strikethrough)
- Text and background colors
- Lists (ordered and unordered)
- Text alignment
- **Images** (via URL)
- **Links**
- **Videos** (via URL)
- Blockquotes and code blocks
- Clean formatting button

**Props:**
```javascript
{
  value: string,          // HTML content
  onChange: function,     // Callback with new HTML
  placeholder: string     // Placeholder text
}
```

**Usage Example:**
```jsx
<RichTextEditor
  value={formData.description_html}
  onChange={(html) => setFormData({ ...formData, description_html: html })}
  placeholder="Enter product description..."
/>
```

**Output Format:** HTML string with inline styles

---

### 4. Product Management (`ProductManagement.js`)

**Location:** `/app/frontend/src/components/admin/ProductManagement.js`

**Features:**
- List all products in table format
- Add new product
- Edit existing product
- Delete product
- Rich text description editor
- Multiple image URLs support
- Category selection
- Stock management

**Form Fields:**
```javascript
{
  title: string,              // Product title *required
  category_id: string,        // Category ID *required
  category_name: string,      // Category name
  price: number,              // Price in USD *required
  compare_price: number,      // Original price (optional)
  stock_level: number,        // Stock quantity *required
  images: string[],           // Array of image URLs
  videos: string[],           // Array of video URLs
  description_html: string    // Rich text HTML content
}
```

**API Endpoints Used:**
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/categories` - Get all categories

---

## File Structure

```
/app/frontend/src/
├── components/
│   ├── admin/
│   │   ├── ProductManagement.js      # Admin product CRUD
│   │   └── RichTextEditor.js         # Rich text editor component
│   └── product/
│       ├── ProductImageGallery.js    # Product image gallery
│       ├── ProductComments.js        # Comments with reactions
│       └── EnhancedProductDetail.js  # Main product page
├── pages/
│   └── AdminPanel.js                 # Admin panel with tabs
└── utils/
    └── api.js                        # API utility functions
```

---

## Styling

### Custom CSS
Product description styling is defined in `/app/frontend/src/App.css`:

```css
.product-description h2,
.product-description h3 {
  /* Custom heading styles */
}

.product-description img {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 2rem auto;
  /* Image styles */
}
```

### Tailwind Classes
All components use Tailwind CSS utility classes for responsive design and styling.

---

## Installation

### Required Packages
```bash
yarn add react-quill
```

### Package Versions
- `react-quill`: ^2.0.0
- `quill`: ^1.3.7

---

## Development Guide

### Adding New Features

#### 1. Add New Field to Product Form
Edit `/app/frontend/src/components/admin/ProductManagement.js`:

```javascript
// Add to formData state
const [formData, setFormData] = useState({
  // ... existing fields
  newField: '',
});

// Add form input
<div>
  <Label htmlFor="newField">New Field</Label>
  <Input
    id="newField"
    value={formData.newField}
    onChange={(e) => setFormData({ ...formData, newField: e.target.value })}
  />
</div>
```

#### 2. Add New Reaction Type
Edit `/app/frontend/src/components/product/ProductComments.js`:

```javascript
// Add new reaction button
<button
  onClick={() => handleReaction(comment.id, 'newReaction')}
  className="flex items-center gap-1 px-3 py-1.5 rounded-full"
>
  <NewIcon className="w-4 h-4" />
  <span>{comment.reactions.newReaction}</span>
</button>
```

#### 3. Customize Rich Text Editor Toolbar
Edit `/app/frontend/src/components/admin/RichTextEditor.js`:

```javascript
const modules = useMemo(() => ({
  toolbar: [
    // Add or remove toolbar options
    ['bold', 'italic'],
    ['link', 'image'],
  ],
}), []);
```

---

## Testing

### Manual Testing Checklist

**Product Gallery:**
- [ ] Multiple images display correctly
- [ ] Clicking thumbnail switches main image
- [ ] Discount badge shows when discount > 0
- [ ] Badges display correctly

**Comments:**
- [ ] Add comment form shows for authenticated users
- [ ] Login prompt shows for non-authenticated users
- [ ] Like/heart reactions increment/decrement
- [ ] Timestamps display correctly

**Admin Panel:**
- [ ] Product list loads
- [ ] Add product form opens
- [ ] Rich text editor renders
- [ ] Images can be inserted in description
- [ ] Product saves successfully
- [ ] Edit product loads existing data
- [ ] Delete product works with confirmation

---

## Common Issues & Solutions

### Issue: Rich Text Editor Not Displaying
**Solution:** Make sure React Quill CSS is imported:
```javascript
import 'react-quill/dist/quill.snow.css';
```

### Issue: Images Not Displaying in Gallery
**Solution:** Check that images array is not empty:
```javascript
const images = product.images && product.images.length > 0 
  ? product.images 
  : ['https://via.placeholder.com/600'];
```

### Issue: Comments Not Saving
**Solution:** Implement backend API endpoint:
```python
@app.post("/api/comments")
async def create_comment(comment: CommentCreate):
    # Save to database
    return {"id": comment_id, "message": "Comment created"}
```

---

## Future Enhancements

### Planned Features
1. **Image Upload:** Direct image upload instead of URLs
2. **Comment Replies:** Nested comment threads
3. **Rich Media in Comments:** Allow images in comments
4. **Product Ratings:** Star rating system
5. **Social Sharing:** Share product on social media
6. **Product Comparison:** Compare multiple products
7. **Wishlist:** Save products for later
8. **Recently Viewed:** Track user's product history

### Technical Improvements
1. Lazy loading for images
2. Image optimization
3. Caching strategy for product data
4. Real-time comment updates (WebSocket)
5. Accessibility improvements (ARIA labels)
6. Unit tests for components
7. E2E tests for admin workflows

---

## Support

For questions or issues:
1. Check this documentation first
2. Review component source code
3. Check browser console for errors
4. Verify API endpoints are working
5. Test with different browsers

---

## Version History

### v1.0 (Current)
- Product image gallery with vertical thumbnails
- Product comments with reactions
- Rich text editor for product descriptions
- Admin product management interface
- Multi-image support
- Video support in gallery

---

Last Updated: December 2024
