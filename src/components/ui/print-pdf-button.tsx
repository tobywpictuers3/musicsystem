import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintPDFButtonProps {
  contentId?: string;
  filename?: string;
  tabName?: string;
}

export const PrintPDFButton = ({ contentId = 'main-content', filename, tabName }: PrintPDFButtonProps) => {
  const handlePrint = async () => {
    try {
      const element = document.getElementById(contentId) || document.body;
      
      toast({
        description: 'מייצא לPDF...',
      });

      // Hide buttons and non-printable elements
      const noPrintElements = element.querySelectorAll('button, .no-print');
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });

      // Get full scrollable content height
      const fullHeight = Math.max(
        element.scrollHeight,
        element.offsetHeight,
        element.clientHeight
      );

      // Create canvas from full content (clean, no colors)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: element.scrollWidth,
        windowHeight: fullHeight,
        backgroundColor: '#ffffff',
        ignoreElements: (el) => {
          return el.tagName === 'BUTTON' || el.classList.contains('no-print');
        }
      });

      // Restore hidden elements
      noPrintElements.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });

      // Convert to grayscale for clean report
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const printableWidth = pageWidth - (margin * 2);
      const printableHeight = pageHeight - (margin * 2);
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / printableWidth;
      const contentHeight = imgHeight / ratio;
      
      let heightLeft = contentHeight;
      let position = 0;

      // Add pages with content only (no background template)
      while (heightLeft > 0) {
        if (position > 0) {
          pdf.addPage();
        }

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = imgWidth;
        const currentHeight = Math.min(printableHeight * ratio, imgHeight - position * ratio);
        pageCanvas.height = currentHeight;
        
        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          pageCtx.drawImage(
            canvas,
            0, position * ratio, imgWidth, currentHeight,
            0, 0, imgWidth, currentHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const h = Math.min(printableHeight, heightLeft);
          pdf.addImage(pageImgData, 'PNG', margin, margin, printableWidth, h, '', 'FAST');
        }

        heightLeft -= printableHeight;
        position += printableHeight;
      }

      // Generate filename with tab name and current date/time
      const now = new Date();
      const dateStr = now.toLocaleDateString('he-IL').replace(/\./g, '-');
      const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
      const finalFilename = filename || `${tabName || 'תצוגה'}-${dateStr}-${timeStr}.pdf`;
      
      pdf.save(finalFilename);

      toast({
        description: 'הקובץ הורד בהצלחה',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה ביצירת PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <Button onClick={handlePrint} variant="outline" size="sm" className="gap-2">
      <FileDown className="h-4 w-4" />
      הדפסה לPDF
    </Button>
  );
};
