import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Move, 
  Link, 
  Home,
  Menu as MenuIcon,
  Navigation,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe,
  ExternalLink,
  Monitor,
  Smartphone
} from 'lucide-react';

interface Menu {
  id: number;
  name: string;
  location: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: number;
  menuId: number;
  parentId?: number;
  title: string;
  url?: string;
  linkType: 'internal' | 'external' | 'custom';
  targetPage?: string;
  icon?: string;
  description?: string;
  isVisible: boolean;
  sortOrder: number;
  cssClass?: string;
  attributes?: any;
  createdAt: string;
  updatedAt: string;
}

interface MenuWithItems extends Menu {
  items: MenuItem[];
}

export default function MenuManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMenu, setSelectedMenu] = useState<number | null>(null);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);

  // Fetch all menus
  const { data: menus, isLoading: menusLoading } = useQuery({
    queryKey: ['/api/admin/menus']
  });

  // Fetch selected menu with items
  const { data: menuWithItems } = useQuery({
    queryKey: [`/api/admin/menus/${selectedMenu}`],
    enabled: !!selectedMenu
  });

  // Create menu mutation
  const createMenuMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/menus', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      toast({ title: 'Menu created successfully!' });
      setIsMenuDialogOpen(false);
      setEditingMenu(null);
    },
    onError: () => {
      toast({ title: 'Failed to create menu', variant: 'destructive' });
    }
  });

  // Update menu mutation
  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/admin/menus/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/menus/${selectedMenu}`] });
      toast({ title: 'Menu updated successfully!' });
      setIsMenuDialogOpen(false);
      setEditingMenu(null);
    },
    onError: () => {
      toast({ title: 'Failed to update menu', variant: 'destructive' });
    }
  });

  // Delete menu mutation
  const deleteMenuMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/menus/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      toast({ title: 'Menu deleted successfully!' });
      if (selectedMenu === deleteMenuMutation.variables) {
        setSelectedMenu(null);
      }
    },
    onError: () => {
      toast({ title: 'Failed to delete menu', variant: 'destructive' });
    }
  });

  // Create menu item mutation
  const createMenuItemMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/menu-items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/menus/${selectedMenu}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      toast({ title: 'Menu item created successfully!' });
      setIsItemDialogOpen(false);
      setEditingMenuItem(null);
    },
    onError: () => {
      toast({ title: 'Failed to create menu item', variant: 'destructive' });
    }
  });

  // Update menu item mutation
  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest('PUT', `/api/admin/menu-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/menus/${selectedMenu}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      toast({ title: 'Menu item updated successfully!' });
      setIsItemDialogOpen(false);
      setEditingMenuItem(null);
    },
    onError: () => {
      toast({ title: 'Failed to update menu item', variant: 'destructive' });
    }
  });

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/menu-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/menus/${selectedMenu}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menus'] });
      toast({ title: 'Menu item deleted successfully!' });
    },
    onError: () => {
      toast({ title: 'Failed to delete menu item', variant: 'destructive' });
    }
  });

  const handleSubmitMenu = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      location: formData.get('location') as string,
      isActive: formData.get('isActive') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0
    };

    if (editingMenu) {
      updateMenuMutation.mutate({ id: editingMenu.id, data });
    } else {
      createMenuMutation.mutate(data);
    }
  };

  const handleSubmitMenuItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      menuId: selectedMenu,
      parentId: formData.get('parentId') ? parseInt(formData.get('parentId') as string) : undefined,
      title: formData.get('title') as string,
      url: formData.get('url') as string || undefined,
      linkType: formData.get('linkType') as string,
      targetPage: formData.get('targetPage') as string || undefined,
      icon: formData.get('icon') as string || undefined,
      description: formData.get('description') as string || undefined,
      isVisible: formData.get('isVisible') === 'on',
      sortOrder: parseInt(formData.get('sortOrder') as string) || 0,
      cssClass: formData.get('cssClass') as string || undefined
    };

    if (editingMenuItem) {
      updateMenuItemMutation.mutate({ id: editingMenuItem.id, data });
    } else {
      createMenuItemMutation.mutate(data);
    }
  };

  if (menusLoading) {
    return <div className="p-6">Loading menus...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">Manage header and footer navigation menus</p>
        </div>
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingMenu(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingMenu ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
              <DialogDescription>
                Configure menu settings and location
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitMenu} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Menu Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingMenu?.name || ''}
                    placeholder="e.g., Header Menu"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Select name="location" defaultValue={editingMenu?.location || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    name="sortOrder"
                    type="number"
                    defaultValue={editingMenu?.sortOrder || 0}
                    min="0"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="isActive"
                    name="isActive"
                    defaultChecked={editingMenu?.isActive !== false}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMenuMutation.isPending || updateMenuMutation.isPending}>
                  {editingMenu ? 'Update Menu' : 'Create Menu'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Menu Overview</TabsTrigger>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {menus?.map((menu: Menu) => (
              <Card key={menu.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {menu.location === 'header' ? (
                          <Navigation className="w-5 h-5 text-primary" />
                        ) : menu.location === 'footer' ? (
                          <Globe className="w-5 h-5 text-primary" />
                        ) : (
                          <MenuIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{menu.name}</CardTitle>
                        <CardDescription>
                          <Badge variant={menu.location === 'header' ? 'default' : 'secondary'}>
                            {menu.location.charAt(0).toUpperCase() + menu.location.slice(1)}
                          </Badge>
                          {menu.isActive ? (
                            <Badge variant="outline" className="ml-2">
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-2">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMenu(menu.id);
                          setActiveTab('items');
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Manage Items
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingMenu(menu);
                          setIsMenuDialogOpen(true);
                        }}
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMenuMutation.mutate(menu.id)}
                        disabled={deleteMenuMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          {selectedMenu ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold">
                    {menuWithItems?.name} Items
                  </h3>
                  <p className="text-muted-foreground">
                    Manage navigation links and structure
                  </p>
                </div>
                <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingMenuItem(null)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Menu Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                      </DialogTitle>
                      <DialogDescription>
                        Configure navigation link settings
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitMenuItem} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            name="title"
                            defaultValue={editingMenuItem?.title || ''}
                            placeholder="Menu item title"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="linkType">Link Type</Label>
                          <Select name="linkType" defaultValue={editingMenuItem?.linkType || 'internal'}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">Internal Page</SelectItem>
                              <SelectItem value="external">External URL</SelectItem>
                              <SelectItem value="custom">Custom Action</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="url">URL/Path</Label>
                          <Input
                            id="url"
                            name="url"
                            defaultValue={editingMenuItem?.url || ''}
                            placeholder="/about or https://example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="icon">Icon (Lucide name)</Label>
                          <Input
                            id="icon"
                            name="icon"
                            defaultValue={editingMenuItem?.icon || ''}
                            placeholder="home, user, settings"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={editingMenuItem?.description || ''}
                          placeholder="Brief description for accessibility"
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="sortOrder">Sort Order</Label>
                          <Input
                            id="sortOrder"
                            name="sortOrder"
                            type="number"
                            defaultValue={editingMenuItem?.sortOrder || 0}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cssClass">CSS Classes</Label>
                          <Input
                            id="cssClass"
                            name="cssClass"
                            defaultValue={editingMenuItem?.cssClass || ''}
                            placeholder="custom-class"
                          />
                        </div>
                        <div className="flex items-center space-x-2 pt-8">
                          <Switch
                            id="isVisible"
                            name="isVisible"
                            defaultChecked={editingMenuItem?.isVisible !== false}
                          />
                          <Label htmlFor="isVisible">Visible</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}>
                          {editingMenuItem ? 'Update Item' : 'Add Item'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuWithItems?.items.map((item: MenuItem) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {item.icon && (
                                <span className="text-muted-foreground">
                                  {/* Icon placeholder */}
                                </span>
                              )}
                              <span>{item.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {item.linkType === 'external' && (
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {item.url || item.targetPage || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.linkType}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.sortOrder}</TableCell>
                          <TableCell>
                            {item.isVisible ? (
                              <Badge variant="outline">
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingMenuItem(item);
                                  setIsItemDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMenuItemMutation.mutate(item.id)}
                                disabled={deleteMenuItemMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MenuIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Menu</h3>
                <p className="text-muted-foreground">
                  Choose a menu from the overview tab to manage its items
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>Live Menu Preview</span>
              </CardTitle>
              <CardDescription>
                See how your menus will appear on the website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {menus?.filter((menu: Menu) => menu.isActive).map((menu: Menu) => (
                  <div key={menu.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center space-x-2">
                      <Badge variant="outline">{menu.location}</Badge>
                      <span>{menu.name}</span>
                    </h4>
                    <div className="text-sm text-muted-foreground">
                      Preview functionality would show the actual rendered menu here
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}