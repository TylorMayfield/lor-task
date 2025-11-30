'use client';

import { useState, useEffect } from 'react';

interface Category {
  _id: string;
  name: string;
  color: string;
  icon?: string;
  children?: Category[];
  parentId?: string;
}

interface CategoryTreeProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
}

export default function CategoryTree({
  selectedCategoryId,
  onCategorySelect,
}: CategoryTreeProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category._id);
    const isSelected = selectedCategoryId === category._id;

    return (
      <div key={category._id} className="mb-1">
        <div
          className={`flex items-center px-2 py-1 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onCategorySelect(category._id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category._id);
              }}
              className="mr-2 w-4 h-4 flex items-center justify-center"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          {!hasChildren && <span className="mr-2 w-4" />}
          <div
            className="w-3 h-3 rounded mr-2"
            style={{ backgroundColor: category.color }}
          />
          {category.icon && <span className="mr-2">{category.icon}</span>}
          <span className="text-sm">{category.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="border rounded-lg p-3 bg-white max-h-64 overflow-y-auto">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Categories</h3>
        <button
          onClick={() => onCategorySelect(null)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Clear
        </button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories yet</p>
      ) : (
        categories.map((category) => renderCategory(category))
      )}
    </div>
  );
}

