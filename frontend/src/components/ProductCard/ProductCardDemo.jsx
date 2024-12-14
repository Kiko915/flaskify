import React from 'react';
import ProductCard from './ProductCard';

const ProductCardDemo = () => {
  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {/* Example matching the provided image */}
      <ProductCard
        variant="detailed"
        title="BLESSED EVERYDAY T-shirt For Men Round Neck"
        price={86}
        rating={4.4}
        reviews={null}
        itemsSold={10000}
        location="Navotas City, Metro Manila"
        freeShipping={true}
        hasDiscount={true}
        discountPercentage={28}
        imageUrl="https://example.com/path-to-tshirt-image.jpg" // Replace with actual image URL
      />

      {/* Additional Examples */}
      <ProductCard
        variant="detailed"
        title="Premium Cotton T-Shirt with Modern Design"
        price={1299}
        rating={4.8}
        reviews={256}
        itemsSold={5234}
        location="Makati, Metro Manila"
        freeShipping={true}
        hasDiscount={true}
        discountPercentage={15}
        imageUrl="https://example.com/path-to-another-image.jpg" // Replace with actual image URL
      />

      <ProductCard
        variant="detailed"
        title="Casual Comfort Fit T-Shirt"
        price={899}
        rating={4.2}
        reviews={89}
        location="Quezon City, Metro Manila"
        freeShipping={true}
        itemsSold={1234}
        imageUrl="https://example.com/path-to-third-image.jpg" // Replace with actual image URL
      />
    </div>
  );
};

export default ProductCardDemo; 