import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Edit, Trash2, Plus, Save, Eye, Code } from 'lucide-react';

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
  isActive: boolean;
  updatedAt: string;
}

export default function EmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    variables: [] as string[],
    category: 'transactional',
    isActive: true
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/admin/email-templates'],
    queryFn: () => apiRequest('/api/admin/email-templates')
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; template: Partial<EmailTemplate> }) =>
      apiRequest(`/api/admin/email-templates/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data.template)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      toast({ title: 'Template updated successfully' });
      setEditMode(false);
      setSelectedTemplate(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: (template: typeof formData) =>
      apiRequest('/api/admin/email-templates', {
        method: 'POST',
        body: JSON.stringify(template)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      toast({ title: 'Template created successfully' });
      setEditMode(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/email-templates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-templates'] });
      toast({ title: 'Template deleted successfully' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      body: '',
      variables: [],
      category: 'transactional',
      isActive: true
    });
    setSelectedTemplate(null);
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables,
      category: template.category,
      isActive: template.isActive
    });
    setEditMode(true);
  };

  const handleSave = () => {
    if (selectedTemplate) {
      updateMutation.mutate({ id: selectedTemplate.id, template: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const extractVariables = (text: string) => {
    const matches = text.match(/{{(\w+)}}/g) || [];
    return [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
  };

  const handleBodyChange = (value: string) => {
    const variables = extractVariables(value + ' ' + formData.subject);
    setFormData({ ...formData, body: value, variables });
  };

  const renderPreview = (template: EmailTemplate) => {
    let preview = template.body;
    template.variables.forEach(variable => {
      preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), `[${variable}]`);
    });
    return preview;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading email templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={() => setEditMode(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map((template: EmailTemplate) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="line-clamp-2">{template.body}</p>
                </div>
                {template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium">Variables:</span>
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(template.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setPreviewMode(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this template?')) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="transactional">Transactional</option>
                  <option value="marketing">Marketing</option>
                  <option value="notification">Notification</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g., Welcome to {{company_name}}!"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Body (HTML supported)</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => handleBodyChange(e.target.value)}
                placeholder="Use {{variable_name}} for dynamic content"
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Active Template</Label>
            </div>
            {formData.variables.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Detected Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map(variable => (
                    <Badge key={variable} variant="secondary">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditMode(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewMode} onOpenChange={setPreviewMode}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Subject:</p>
                <p>{selectedTemplate.subject}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="prose prose-sm max-w-none" 
                     dangerouslySetInnerHTML={{ __html: renderPreview(selectedTemplate) }} />
              </div>
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const html = `<html><body>${renderPreview(selectedTemplate)}</body></html>`;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  }}
                >
                  <Code className="w-4 h-4 mr-2" />
                  View HTML Source
                </Button>
                <Button onClick={() => setPreviewMode(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}