import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  TreePine,
  Building2,
  Folder,
  FolderOpen,
  Eye
} from 'lucide-react';
import { Link } from 'wouter';
import { tj } from "@/i18n-jsx/tj";

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  businessCount: number;
  description?: string;
  isActive: boolean;
  children?: Category[];
}

export default function CategoryHierarchyMini() {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([60949])); // Expand accounting by default
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories/with-stats'],
  });

  // Build hierarchical structure (limit to 3 main categories for demo)
  const buildHierarchy = (categories: Category[]): Category[] => {
    const categoryMap = new Map<number, Category>();
    const rootCategories: Category[] = [];

    // Initialize all categories with children array
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build hierarchy
    categories.forEach(cat => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId === null) {
        rootCategories.push(category);
      } else {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children!.push(category);
        }
      }
    });

    // Return only first 3 main categories for demo
    return rootCategories.slice(0, 3);
  };

  const hierarchicalCategories = buildHierarchy(categories);

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  // Tree Node Component
  const TreeNode: React.FC<{ category: Category; depth: number }> = ({ category, depth }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const indentStyle = { paddingLeft: `${depth * 16}px` };

    return (
      <div className="category-tree-node">
        <div 
          className={`flex items-center py-1.5 px-2 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedCategory?.id === category.id ? 'bg-blue-50' : ''
          }`}
          style={indentStyle}
          onClick={() => setSelectedCategory(category)}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            ) : (
              <div className="h-5 w-5 flex items-center justify-center">
                <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
              </div>
            )}
            
            {hasChildren ? (
              isExpanded ? <FolderOpen className="h-3 w-3 text-blue-500" /> : <Folder className="h-3 w-3 text-gray-500" />
            ) : (
              <Building2 className="h-3 w-3 text-green-500" />
            )}
            
            <span className="font-medium text-xs truncate">{category.name}</span>
            
            <Badge variant="secondary" className="ms-auto text-xs h-4">
              {category.businessCount || 0}
            </Badge>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children!.slice(0, 5).map(child => ( // Limit to 5 children for demo
              <TreeNode key={child.id} category={child} depth={depth + 1} />
            ))}
            {category.children!.length > 5 && (
              <div 
                className="text-xs text-gray-500 ps-8 py-1 cursor-pointer hover:text-blue-500"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >{tj("+{0} more...", category.children!.length - 5)}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-500">Loading categories...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TreePine className="h-5 w-5" />
          Category Hierarchy Preview
        </CardTitle>
        <p className="text-sm text-gray-600">
          Interactive visualization of business categories (showing first 3 main categories)
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border rounded-lg max-h-64 overflow-y-auto">
          {hierarchicalCategories.map(category => (
            <TreeNode key={category.id} category={category} depth={0} />
          ))}
        </div>
        
        {selectedCategory && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">{selectedCategory.name}</h4>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{tj("Level {0}", selectedCategory.level)}</Badge>
                  <Badge variant="secondary" className="text-xs">{tj("{0} businesses", selectedCategory.businessCount || 0)}</Badge>
                </div>
              </div>
              <Link href={`/categories/${selectedCategory.slug}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 me-1" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        <div className="p-4 border-t">
          <Link href="/category-hierarchy">
            <Button variant="outline" size="sm" className="w-full">
              View Full Interactive Hierarchy
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}