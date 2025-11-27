import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (term) => {
    if (!term.trim()) return;

    // Save to recent searches
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_searches', JSON.stringify(updated));

    // Navigate to products page with search query
    router.push(`/products?search=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
  };

  const fetchSuggestions = async (term) => {
    if (!term.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/products`, {
        params: {
          search: term,
          limit: 5
        }
      });

      if (response.data.success) {
        setSuggestions(response.data.data.products);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchTerm);
    }
  };

  return (
    <div className="relative w-full md:flex-1 max-w-2xl mx-0 md:mx-4" ref={searchRef}>
      <div className="relative group">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (searchTerm.trim() || recentSearches.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Kërko produkte..."
          className="w-full px-3 py-2 md:px-4 md:py-3 pl-10 md:pl-12 pr-20 md:pr-28 border-2 border-gray-200 rounded-full focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all shadow-sm hover:shadow-md hover:border-green-300 text-sm md:text-base bg-white/50 backdrop-blur-sm group-hover:bg-white"
        />
        <div className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-green-600 transition-colors text-sm md:text-base">
          🔍
        </div>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-16 md:right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors text-sm md:text-base hover:scale-110"
          >
            ✕
          </button>
        )}
        <button
          onClick={() => handleSearch(searchTerm)}
          className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-xs md:text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className="hidden sm:inline">Kërko</span>
          <span className="sm:hidden">🔍</span>
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-100 rounded-2xl shadow-2xl max-h-96 overflow-y-auto backdrop-blur-sm">
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs text-gray-500 px-2 py-1">Sugjerime</div>
              {suggestions.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  onClick={() => setShowSuggestions(false)}
                  className="block px-4 py-2 hover:bg-gray-100 rounded"
                >
                  <div className="flex items-center gap-3">
                    {product.image_urls && product.image_urls.length > 0 && (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.price} L / {product.unit}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2 border-t">
              <div className="text-xs text-gray-500 px-2 py-1">Kërkime të fundit</div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchTerm(search);
                    handleSearch(search);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <span>🕒</span>
                  <span>{search}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length === 0 && recentSearches.length === 0 && searchTerm.trim() && (
            <div className="p-4 text-center text-gray-500">
              Nuk u gjet asnjë produkt
            </div>
          )}
        </div>
      )}
    </div>
  );
}

