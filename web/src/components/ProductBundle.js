import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function ProductBundle({ products, discount = 10, onAddToCart }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const totalPrice = products.reduce((sum, p) => sum + parseFloat(p.price), 0);
  const bundlePrice = totalPrice * (1 - discount / 100);
  const savings = totalPrice - bundlePrice;

  const handleAddBundle = async () => {
    if (!onAddToCart) return;
    
    setAdding(true);
    try {
      for (const product of products) {
        await onAddToCart(product.id, 1);
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Error adding bundle:', error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-1">
            🎁 Bundle Special
          </h3>
          <p className="text-sm sm:text-base text-green-700">
            Bleni së bashku dhe kurseni {discount}%!
          </p>
        </div>
        <div className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-sm sm:text-base animate-pulse">
          -{discount}%
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="bg-white rounded-lg p-2 hover:shadow-md transition"
          >
            {product.image_urls && product.image_urls.length > 0 && (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-full h-20 sm:h-24 object-cover rounded mb-2"
              />
            )}
            <p className="text-xs sm:text-sm font-semibold line-clamp-2">{product.name}</p>
            <p className="text-xs text-green-700 font-bold">{product.price} L</p>
          </Link>
        ))}
      </div>

      <div className="border-t border-green-300 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-600 line-through">Total: {totalPrice.toFixed(2)} L</p>
            <p className="text-xl sm:text-2xl font-bold text-green-700">
              Bundle: {bundlePrice.toFixed(2)} L
            </p>
            <p className="text-sm text-green-600 font-semibold">
              Kurseni: {savings.toFixed(2)} L
            </p>
          </div>
        </div>
        <button
          onClick={handleAddBundle}
          disabled={adding || added}
          className="w-full bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:bg-green-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {adding ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Duke shtuar...</span>
            </>
          ) : added ? (
            <>
              <span>✅</span>
              <span>Shtuar në shportë!</span>
            </>
          ) : (
            <>
              <span>🛒</span>
              <span>Shto Bundle në Shportë</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

