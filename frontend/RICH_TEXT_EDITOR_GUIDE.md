# Rich Text Editor Guide - Product Description

## Overview
The HTML editor now supports **two ways to add images**:
1. **Image from URL** - Insert image link from internet
2. **Upload from Computer** - Upload image file directly

---

## Image Insertion Methods

### Method 1: Image from URL
**Button:** Image icon (with small link badge)

**Steps:**
1. Click the **Image** button (picture icon)
2. Enter image URL in the prompt
3. Click OK
4. Image will be inserted at cursor position

**Example URL:**
```
https://images.unsplash.com/photo-1517336714731
```

**Result:**
```html
<img src="https://images.unsplash.com/photo-1517336714731" 
     alt="Product image" 
     style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />
```

---

### Method 2: Upload from Computer
**Button:** Upload icon (cloud with arrow)

**Steps:**
1. Click the **Upload** button (cloud icon)
2. Select image file from your computer
3. Image will be converted to Base64
4. Automatically inserted at cursor position

**File Requirements:**
- Format: JPG, PNG, GIF, WebP
- Max size: 2MB per image
- Recommended: Optimize images before upload

**Result:**
```html
<img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEA..." 
     alt="Product image" 
     style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />
```

---

## Complete Toolbar Guide

### Text Formatting
| Button | Function | HTML Output |
|--------|----------|-------------|
| **Heading** dropdown | Insert headings | `<h1>`, `<h2>`, `<h3>`, `<h4>` |
| **B** (Bold) | Bold text | `<strong>Bold</strong>` |
| **I** (Italic) | Italic text | `<em>Italic</em>` |

### Lists
| Button | Function | HTML Output |
|--------|----------|-------------|
| Bullet list | Unordered list | `<ul><li>Item</li></ul>` |
| Numbered list | Ordered list | `<ol><li>Item</li></ol>` |

### Insert Elements
| Button | Function | Description |
|--------|----------|-------------|
| Link icon | Insert link | Prompts for URL |
| Image icon | Image from URL | Prompts for image URL |
| Cloud icon | Upload image | Opens file picker |
| Paragraph | Insert paragraph | `<p>Text</p>` |

### Preview
| Button | Function |
|--------|----------|
| Eye icon | Toggle live preview |

---

## Usage Examples

### Example 1: Product Description with Images
```html
<h2>MacBook Pro 16-inch Features</h2>
<p>The new MacBook Pro features the powerful M3 chip...</p>

<img src="data:image/jpeg;base64,..." alt="MacBook Pro" />

<h3>Technical Specifications</h3>
<ul>
  <li>M3 Pro or M3 Max chip</li>
  <li>Up to 128GB unified memory</li>
  <li>Up to 8TB SSD storage</li>
</ul>

<img src="https://example.com/specs.jpg" alt="Specifications" />

<p>Perfect for professional workflows...</p>
```

### Example 2: Step-by-Step Guide
```html
<h2>How to Use</h2>

<h3>Step 1: Unboxing</h3>
<p>Carefully open the package...</p>
<img src="data:image/jpeg;base64,..." alt="Step 1" />

<h3>Step 2: Setup</h3>
<p>Connect the power adapter...</p>
<img src="data:image/jpeg;base64,..." alt="Step 2" />

<h3>Step 3: Enjoy</h3>
<p>Start using your new device!</p>
```

### Example 3: Feature Comparison
```html
<h2>What's New</h2>

<p>Compare the new model with the previous generation:</p>

<img src="https://example.com/comparison.jpg" alt="Comparison" />

<strong>Key improvements:</strong>
<ol>
  <li>40% faster performance</li>
  <li>2x battery life</li>
  <li>Brighter display</li>
</ol>
```

---

## Best Practices

### Image Optimization
1. **Compress images** before upload
   - Use TinyPNG, Squoosh, or similar tools
   - Target: Under 500KB for description images

2. **Use appropriate dimensions**
   - Width: 600-800px is ideal
   - Height: Maintain aspect ratio

3. **Mix URLs and uploads**
   - Official product images: Use URLs
   - Custom photos/diagrams: Upload from computer

### Content Structure
1. **Start with heading** (H2 or H3)
2. **Brief introduction** paragraph
3. **Image** to illustrate
4. **Detailed explanation**
5. **More images** as needed
6. **Lists** for specifications
7. **Conclusion** paragraph

### Writing Tips
1. Break text into short paragraphs
2. Use headings to organize sections
3. Add images every 2-3 paragraphs
4. Use lists for easy scanning
5. Include product features and benefits

---

## Technical Details

### Base64 Encoding
When you upload an image:
1. JavaScript reads the file
2. Converts to Base64 string
3. Embeds directly in HTML
4. Stored with product in database

**Advantages:**
- No separate file storage needed
- Works immediately
- Portable (contained in HTML)

**Disadvantages:**
- Increases HTML size (~33% larger)
- Not ideal for very large images
- Slower initial load

### Image Styling
All images inserted get automatic styling:
```css
max-width: 100%;          /* Responsive */
height: auto;             /* Maintain aspect ratio */
border-radius: 8px;       /* Rounded corners */
margin: 20px 0;           /* Spacing */
```

### Storage Considerations
- **URL images**: Only URL stored (~100 bytes)
- **Uploaded images**: Full Base64 stored (~1.3x file size)
- **Recommendation**: Use URLs for large images, upload for small diagrams/icons

---

## Troubleshooting

### Issue: Upload Button Not Working
**Solutions:**
- Check file is an image (JPG, PNG, etc.)
- Verify file size is under 2MB
- Try different image
- Check browser console for errors

### Issue: Image Too Large
**Solutions:**
1. Compress image using online tools
2. Resize to smaller dimensions
3. Convert to JPEG (smaller than PNG)
4. Use URL method instead

### Issue: Image Not Displaying
**Solutions:**
- For URLs: Check URL is accessible
- For uploads: Check Base64 string is complete
- Verify image format is supported
- Check image isn't blocked by browser

### Issue: Slow Editor Performance
**Causes:**
- Too many large Base64 images
- Very long HTML content

**Solutions:**
- Use URL method for large images
- Reduce image file sizes
- Split content into sections

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Bold | (Manual: click B button) |
| Italic | (Manual: click I button) |
| Preview | (Manual: click Eye button) |
| Save | Ctrl+S (form submit) |

---

## Examples Gallery

### Electronics Product
```html
<h2>Premium Wireless Headphones</h2>
<p>Experience studio-quality sound with our flagship headphones.</p>

<img src="data:image/jpeg;base64,..." alt="Headphones" />

<h3>Features</h3>
<ul>
  <li>Active Noise Cancellation</li>
  <li>40-hour battery life</li>
  <li>Premium materials</li>
</ul>
```

### Clothing Product
```html
<h2>Classic Cotton T-Shirt</h2>
<p>Soft, breathable, and perfect for everyday wear.</p>

<img src="https://example.com/tshirt-front.jpg" alt="Front view" />
<img src="https://example.com/tshirt-back.jpg" alt="Back view" />

<h3>Material</h3>
<p>100% organic cotton, sustainably sourced.</p>
```

### Food Product
```html
<h2>Artisan Coffee Beans</h2>
<p>Single-origin beans from the mountains of Colombia.</p>

<img src="data:image/jpeg;base64,..." alt="Coffee beans" />

<h3>Tasting Notes</h3>
<ul>
  <li>Rich chocolate aroma</li>
  <li>Smooth, balanced flavor</li>
  <li>Hints of caramel</li>
</ul>

<img src="data:image/jpeg;base64,..." alt="Brewing" />

<h3>Brewing Recommendations</h3>
<p>Use 15g of coffee per 250ml of water at 93°C...</p>
```

---

## FAQ

**Q: Can I upload GIFs?**
A: Yes, GIF format is supported.

**Q: Can I edit inserted images?**
A: Edit the HTML directly in the editor. Change src, alt, or style attributes.

**Q: Can I upload videos?**
A: Not directly. Use video hosting (YouTube, Vimeo) and embed with iframe.

**Q: What's the difference between URL and Upload?**
A: URL stores only the link. Upload converts and stores the entire image.

**Q: Can I upload multiple images at once?**
A: Currently one at a time. Click upload button for each image.

**Q: Can I drag and drop images?**
A: Not yet. Use the upload button to select files.

---

## Future Enhancements

### Planned Features
1. Drag & drop image upload
2. Image resizer/cropper
3. Cloud storage integration
4. Image gallery/library
5. Paste images from clipboard
6. Video upload support
7. Markdown support
8. Table builder
9. Color picker for text
10. Font size selector

---

## Support

For issues or questions:
1. Check this guide
2. Verify file format and size
3. Test with different images
4. Check browser console
5. Contact developer

---

Last Updated: December 2024
