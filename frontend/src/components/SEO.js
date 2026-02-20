import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * SEO Component for meta tags optimization
 * Optimized for Google Ads and organic search
 */
const SEO = ({
  title = 'Y-store - Інтернет-магазин електроніки та побутової техніки',
  description = 'Y-store - найкращий інтернет-магазин електроніки в Україні. Смартфони, ноутбуки, побутова техніка за найкращими цінами. Швидка доставка по всій Україні.',
  keywords = 'інтернет магазин, електроніка, смартфони, ноутбуки, побутова техніка, телевізори, купити онлайн, доставка',
  image = '/logo.png',
  url = typeof window !== 'undefined' ? window.location.href : '',
  type = 'website',
  productData = null,
}) => {
  const siteUrl = process.env.REACT_APP_SITE_URL || 'https://ystore.ua';
  const fullUrl = url || siteUrl;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Structured Data for Product (Schema.org)
  const productSchema = productData ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": productData.name,
    "image": productData.images || [],
    "description": productData.description,
    "sku": productData.id,
    "brand": {
      "@type": "Brand",
      "name": "Y-store"
    },
    "offers": {
      "@type": "Offer",
      "url": fullUrl,
      "priceCurrency": "UAH",
      "price": productData.price,
      "availability": "https://schema.org/InStock",
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  } : null;

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Y-store",
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+380502474161",
      "contactType": "customer service",
      "areaServed": "UA",
      "availableLanguage": ["Ukrainian", "Russian"]
    },
    "sameAs": [
      "https://facebook.com/ystore",
      "https://instagram.com/ystore",
      "https://twitter.com/ystore"
    ]
  };

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:locale" content="uk_UA" />
      <meta property="og:site_name" content="Y-store" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#1e40af" />

      {/* Google Ads Optimization */}
      <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      
      {productSchema && (
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
