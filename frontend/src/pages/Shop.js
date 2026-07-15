import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ProductCard } from '../components/ProductCard';
import { toast } from 'sonner';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { fallbackProducts } from '../data/fallbackProducts';

const categories = ['All', 'Cakes', 'Cupcakes', 'Pastries', 'Donuts', 'Cookies', 'Muffins', 'Breads', 'Macarons', 'Pies & Tarts', 'Brownies & Bars', 'Ice Cream & Frozen', 'Beverages', 'Gift Hampers', 'Savory', 'Custom Cakes'];

const PRODUCTS_PER_PAGE = 16;

const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
];

const normalizeProducts = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => ({
      ...row,
      id: row?.id || row?.slug || `generated-${index + 1}`,
      name: row?.name || 'Unnamed Product',
      category: row?.category || 'Uncategorized',
      description: row?.description || '',
      image: row?.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800',
      price: Number(row?.price) || 0,
      stock: Number.isFinite(Number(row?.stock)) ? Number(row.stock) : 0,
    }))
    .filter((row) => Boolean(row.id));
};

export const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState(fallbackProducts);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  // Reset page when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // The base URL is now set globally in src/index.js
      const response = await axios.get('/api/products', { timeout: 10000 });

      const normalized = normalizeProducts(response.data);
      setProducts(normalized.length > 0 ? normalized : fallbackProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error(error.message || 'Could not load products. The backend might be offline.');
      setProducts(fallbackProducts);
    } finally {
      setLoading(false);
    }
  };

  // Filter, sort, and paginate
  const { paginatedProducts, totalPages, totalFiltered } = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / PRODUCTS_PER_PAGE);
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    const paginatedProducts = filtered.slice(start, start + PRODUCTS_PER_PAGE);

    return { paginatedProducts, totalPages, totalFiltered };
  }, [products, selectedCategory, searchQuery, sortBy, currentPage]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const nextParams = {};
    if (category !== 'All') nextParams.category = category;
    if (searchQuery.trim()) nextParams.search = searchQuery.trim();
    setSearchParams(nextParams);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    const nextParams = {};
    if (selectedCategory !== 'All') nextParams.category = selectedCategory;
    if (value.trim()) nextParams.search = value.trim();
    setSearchParams(nextParams);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12" data-testid="shop-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-['Playfair_Display'] font-bold text-[#2D241E] tracking-tight mb-4">
            Our Products
          </h1>
          <p className="text-base text-[#5C4B40]">
            Explore our full collection of 180+ artisan baked goods
          </p>
        </div>

        {/* Search & Sort Row */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8A7E74]" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none"
              data-testid="search-input"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full md:w-64">
            <SlidersHorizontal className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8A7E74]" size={18} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-[#E3DCCF] focus:ring-2 focus:ring-[#C25934]/20 focus:border-[#C25934] bg-white transition-all duration-300 outline-none appearance-none cursor-pointer text-[#2D241E]"
              data-testid="sort-select"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 md:px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-[#C25934] text-white shadow-md'
                    : 'bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934]'
                }`}
                data-testid={`category-filter-${category.toLowerCase().replace(/[ &]/g, '-')}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {totalFiltered === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-[#5C4B40]">No products found matching your criteria.</p>
          </div>
        ) : (
          <>
            {/* Count & info */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-[#5C4B40] text-sm" data-testid="products-count">
                Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}-{Math.min(currentPage * PRODUCTS_PER_PAGE, totalFiltered)} of {totalFiltered} products
              </p>
              <p className="text-[#8A7E74] text-sm">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="products-grid">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center mt-16 space-x-2" data-testid="pagination">
                {/* Prev */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center space-x-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                    currentPage === 1
                      ? 'bg-[#F3EFE6] text-[#8A7E74] cursor-not-allowed'
                      : 'bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934]'
                  }`}
                  data-testid="pagination-prev"
                >
                  <ChevronLeft size={16} />
                  <span>Prev</span>
                </button>

                {/* Page Numbers */}
                {getPageNumbers()[0] > 1 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="w-10 h-10 rounded-lg font-medium text-sm bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934] transition-all duration-300"
                      data-testid="pagination-1"
                    >
                      1
                    </button>
                    {getPageNumbers()[0] > 2 && (
                      <span className="text-[#8A7E74] px-1">...</span>
                    )}
                  </>
                )}

                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium text-sm transition-all duration-300 ${
                      page === currentPage
                        ? 'bg-[#C25934] text-white shadow-md'
                        : 'bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934]'
                    }`}
                    data-testid={`pagination-${page}`}
                  >
                    {page}
                  </button>
                ))}

                {getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                  <>
                    {getPageNumbers()[getPageNumbers().length - 1] < totalPages - 1 && (
                      <span className="text-[#8A7E74] px-1">...</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-10 h-10 rounded-lg font-medium text-sm bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934] transition-all duration-300"
                      data-testid={`pagination-${totalPages}`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center space-x-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                    currentPage === totalPages
                      ? 'bg-[#F3EFE6] text-[#8A7E74] cursor-not-allowed'
                      : 'bg-white text-[#2D241E] border border-[#E3DCCF] hover:border-[#C25934] hover:text-[#C25934]'
                  }`}
                  data-testid="pagination-next"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
