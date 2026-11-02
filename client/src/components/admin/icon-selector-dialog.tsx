import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdaptiveIconPack from './adaptive-icon-pack';
import { Settings, Palette } from 'lucide-react';

interface IconSelectorDialogProps {
  selectedIcon?: string;
  onIconSelect: (iconName: string) => void;
  menuItemTitle?: string;
  children?: React.ReactNode;
}

export default function IconSelectorDialog({
  selectedIcon,
  onIconSelect,
  menuItemTitle,
  children
}: IconSelectorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedIcon, setTempSelectedIcon] = useState(selectedIcon || '');

  const handleIconSelect = (iconName: string) => {
    setTempSelectedIcon(iconName);
  };

  const handleConfirm = () => {
    onIconSelect(tempSelectedIcon);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelectedIcon(selectedIcon || '');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Palette className="w-4 h-4 mr-2" />
            Choose Icon
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Adaptive Icon Pack - Select Navigation Icon</span>
            {menuItemTitle && (
              <Badge variant="secondary" className="ml-2">
                {menuItemTitle}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <AdaptiveIconPack
            selectedIcon={tempSelectedIcon}
            onIconSelect={handleIconSelect}
            menuItemTitle={menuItemTitle}
            showSuggestions={true}
          />
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {tempSelectedIcon && (
                <Badge variant="outline" className="text-sm">
                  Selected: {tempSelectedIcon}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={!tempSelectedIcon}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Apply Icon
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}