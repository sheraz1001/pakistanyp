import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Plus, Edit, Trash2, Eye, FolderOpen, Tags
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { t as tx } from "@shared/i18n";
import { tj } from "@/i18n-jsx/tj";

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  description?: string;
  business_count?: number;
  is_active?: boolean;
  slug?: string;
  level?: number;
}

interface BusinessCategoriesProps {
  className?: string;
}

export default function BusinessCategories({ className }: BusinessCategoriesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    parentId: null as number | null
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories with stats
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["/api/categories/with-stats"],
    queryFn: () => apiRequest("GET", "/api/categories/with-stats"),
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: (categoryData: any) => 
      apiRequest("POST", "/api/admin/categories", categoryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/with-stats"] });
      setShowAddDialog(false);
      setNewCategory({ name: "", description: "", parentId: null });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => 
      apiRequest("PUT", `/api/admin/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/with-stats"] });
      setShowEditDialog(false);
      setSelectedCategory(null);
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update category",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories/with-stats"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    addCategoryMutation.mutate(newCategory);
  };

  const handleEditCategory = () => {
    if (!selectedCategory) return;
    updateCategoryMutation.mutate(selectedCategory);
  };

  const handleDeleteCategory = (category: Category) => {
    if (confirm(tx("Are you sure you want to delete \"{0}\"?", category.name))) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  // Build category hierarchy
  const buildCategoryHierarchy = () => {
    const mainCategories = categories.filter((cat: Category) => cat.parent_id === null);
    
    return mainCategories.map((main: Category) => {
      const subcategories = categories.filter((cat: Category) => cat.parent_id === main.id);
      
      return {
        main,
        subcategories: subcategories.map((sub: Category) => ({
          category: sub,
          specialized: categories.filter((cat: Category) => cat.parent_id === sub.id)
        }))
      };
    });
  };

  const categoryHierarchy = buildCategoryHierarchy();

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Business Categories Management
          </CardTitle>
          <CardDescription>
            Manage business categories, subcategories, and specialized categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{tj("{0} Total Categories", categories.length)}</Badge>
              <Badge variant="outline">{tj("{0} Main Categories", categories.filter((c: Category) => c.parent_id === null).length)}</Badge>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 me-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                  <DialogDescription>
                    Create a new business category or subcategory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Enter category description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent">Parent Category</Label>
                    <Select
                      value={newCategory.parentId?.toString() || "none"}
                      onValueChange={(value) => setNewCategory({ 
                        ...newCategory, 
                        parentId: value === "none" ? null : parseInt(value)
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select parent category (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Main Category)</SelectItem>
                        {categories
                          .filter((cat: Category) => cat.parent_id === null || 
                            categories.find((p: Category) => p.id === cat.parent_id && p.parent_id === null))
                          .map((cat: Category) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.parent_id ? `${categories.find((p: Category) => p.id === cat.parent_id)?.name} > ` : ''}
                              {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddCategory} 
                    disabled={addCategoryMutation.isPending}
                  >
                    {addCategoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {categoryHierarchy.map(({ main, subcategories }) => (
                <Card key={main.id} className="border-s-4 border-s-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold">{main.name}</h3>
                          {main.description && (
                            <p className="text-sm text-gray-600">{main.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary">{tj("{0} businesses", main.business_count || 0)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(main);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCategory(main)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {subcategories.length > 0 && (
                      <div className="space-y-2">
                        {subcategories.map(({ category: sub, specialized }) => (
                          <div key={sub.id} className="border-s-2 border-s-gray-300 ps-4">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-medium">{sub.name}</p>
                                  {sub.description && (
                                    <p className="text-sm text-gray-600">{sub.description}</p>
                                  )}
                                </div>
                                <Badge variant="outline">{tj("{0} businesses", sub.businessCount || 0)}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCategory(sub);
                                    setShowEditDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCategory(sub)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {specialized.length > 0 && (
                              <div className="border-s-2 border-s-gray-200 ps-4 space-y-1">
                                {specialized.map((spec) => (
                                  <div key={spec.id} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{spec.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {spec.businessCount || 0}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCategory(spec);
                                          setShowEditDialog(true);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteCategory(spec)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>
                  Update category information
                </DialogDescription>
              </DialogHeader>
              {selectedCategory && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-name">Category Name</Label>
                    <Input
                      id="edit-name"
                      value={selectedCategory.name}
                      onChange={(e) => setSelectedCategory({ 
                        ...selectedCategory, 
                        name: e.target.value 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={selectedCategory.description || ""}
                      onChange={(e) => setSelectedCategory({ 
                        ...selectedCategory, 
                        description: e.target.value 
                      })}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditCategory}
                  disabled={updateCategoryMutation.isPending}
                >
                  {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}