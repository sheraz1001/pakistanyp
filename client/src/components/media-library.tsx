import { dateLocale } from "@shared/i18n";
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Folder, Image, FileText, Film, Music, Trash2, Download, Search, Grid, List, X } from 'lucide-react';
import { tj } from "@/i18n-jsx/tj";

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  folderId?: number;
  uploadedBy: string;
  uploadedAt: string;
  tags: string[];
}

interface MediaFolder {
  id: number;
  name: string;
  parentId?: number;
  filesCount: number;
  createdAt: string;
}

export default function MediaLibrary() {
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: folders = [] } = useQuery({
    queryKey: ['/api/admin/media/folders'],
    queryFn: () => apiRequest('/api/admin/media/folders')
  });

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['/api/admin/media/files', selectedFolder, searchQuery],
    queryFn: () => apiRequest(`/api/admin/media/files?${new URLSearchParams({
      ...(selectedFolder && { folderId: selectedFolder.toString() }),
      ...(searchQuery && { search: searchQuery })
    })}`)
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/files'] });
      toast({ title: 'Files uploaded successfully' });
      setUploadDialogOpen(false);
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; parentId?: number }) =>
      apiRequest('/api/admin/media/folders', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/folders'] });
      toast({ title: 'Folder created successfully' });
      setCreateFolderOpen(false);
      setFolderName('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileIds: number[]) =>
      apiRequest('/api/admin/media/delete', {
        method: 'DELETE',
        body: JSON.stringify({ fileIds })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/files'] });
      toast({ title: 'Files deleted successfully' });
      setSelectedFiles([]);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });
    if (selectedFolder) {
      formData.append('folderId', selectedFolder.toString());
    }

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Film className="w-5 h-5" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const downloadFile = (file: MediaFile) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.originalName;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Media Library</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <Folder className="w-4 h-4 me-2" />
            New Folder
          </Button>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 me-2" />
            Upload Files
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Folders Sidebar */}
        <div className="w-64 space-y-2">
          <Button
            variant={selectedFolder === null ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setSelectedFolder(null)}
          >
            <Folder className="w-4 h-4 me-2" />
            All Files
          </Button>
          {folders.map((folder: MediaFolder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setSelectedFolder(folder.id)}
            >
              <Folder className="w-4 h-4 me-2" />
              {folder.name}
              <Badge variant="secondary" className="ms-auto">
                {folder.filesCount}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Files Area */}
        <div className="flex-1 space-y-4">
          {/* Toolbar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
              {selectedFiles.length > 0 && (
                <>
                  <Badge variant="secondary">{tj("{0} selected", selectedFiles.length)}</Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete selected files?')) {
                        deleteMutation.mutate(selectedFiles);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 me-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-accent' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-accent' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Files Grid/List */}
          {isLoading ? (
            <div className="text-center py-8">Loading files...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files found. Upload some files to get started.
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4">
              {files.map((file: MediaFile) => (
                <Card
                  key={file.id}
                  className={`cursor-pointer transition-all ${
                    selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
                      {file.mimeType.startsWith('image/') && file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt={file.originalName} className="w-full h-full object-cover" />
                      ) : (
                        getFileIcon(file.mimeType)
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    <div className="mt-2 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadFile(file);
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file: MediaFile) => (
                <div
                  key={file.id}
                  className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFiles.includes(file.id) ? 'bg-accent' : ''
                  }`}
                  onClick={() => toggleFileSelection(file.id)}
                >
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1">
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-muted-foreground">{tj("{0} • Uploaded {1}", formatFileSize(file.size), new Date(file.uploadedAt).toLocaleDateString(dateLocale()))}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(file);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to select
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="max-w-xs mx-auto"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Folder name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createFolderMutation.mutate({ 
                  name: folderName,
                  parentId: selectedFolder || undefined
                })}
                disabled={!folderName.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}