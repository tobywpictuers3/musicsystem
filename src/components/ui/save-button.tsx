import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Cloud, Loader2 } from 'lucide-react';
import { hybridSync } from '@/lib/hybridSync';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

export const SaveButton = () => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const result = await hybridSync.onDataChange();

      if (result.success) {
        toast({
          title: '✅ השמירה הושלמה בהצלחה',
          description: result.message,
        });
      } else {
        toast({
          title: '❌ שגיאה בשמירה',
          description: result.message,
          variant: 'destructive',
        });
      }

    } catch (error) {
      logger.error('Save error:', error);
      toast({
        title: '❌ שגיאה בשמירה',
        description: 'אירעה תקלה. נסי שוב.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button 
      onClick={handleSave} 
      disabled={isSaving}
      className="gap-2"
      variant="default"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          שומר...
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          <Save className="h-4 w-4" />
          שמור שינויים
        </>
      )}
    </Button>
  );
};
