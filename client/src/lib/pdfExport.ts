import jsPDF from 'jspdf';
import type { BrandMap, GameSession } from '@shared/schema';

export const exportToPDF = async (brandMap: BrandMap, session: GameSession): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10): number => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to check if we need a new page
  const checkPageBreak = (nextHeight: number): void => {
    if (yPosition + nextHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Header
  pdf.setFillColor(139, 92, 246); // Soul color
  pdf.rect(0, 0, pageWidth, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Душа Бренду', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ваша персональна карта бренду', pageWidth / 2, 26, { align: 'center' });

  yPosition = 45;
  pdf.setTextColor(0, 0, 0);

  // Session info
  const createdDate = new Date(session.createdAt).toLocaleDateString('uk-UA');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Створено: ${createdDate}`, margin, yPosition);
  yPosition += 10;

  // Divider line
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // SOUL SECTION
  pdf.setTextColor(139, 92, 246);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('❤️ Душа Бренду', margin, yPosition);
  yPosition += 12;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Сенс, цінності та місія вашого бренду', margin, yPosition);
  yPosition += 15;

  // Mission
  if (brandMap.soul.mission) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Місія:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.soul.mission, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Values
  if (brandMap.soul.values.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Ключові цінності:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    brandMap.soul.values.forEach((value, index) => {
      checkPageBreak(8);
      pdf.text(`• ${value}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Story
  if (brandMap.soul.story) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Історія бренду:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.soul.story, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Purpose
  if (brandMap.soul.purpose) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Призначення:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.soul.purpose, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 15;
  }

  // MIND SECTION
  checkPageBreak(30);
  pdf.setTextColor(59, 130, 246);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🧠 Розум Бренду', margin, yPosition);
  yPosition += 12;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Стратегія, позиціонування та унікальна пропозиція', margin, yPosition);
  yPosition += 15;

  // Brand Idea
  if (brandMap.mind.brandIdea) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Бренд-ідея:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.mind.brandIdea, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Target Audience
  if (brandMap.mind.targetAudience) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Цільова аудиторія:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.mind.targetAudience, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Archetype
  if (brandMap.mind.archetype) {
    checkPageBreak(15);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Архетип бренду:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(brandMap.mind.archetype, margin, yPosition);
    yPosition += 12;
  }

  // Promise
  if (brandMap.mind.promise) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Обіцянка клієнтам:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.mind.promise, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Positioning
  if (brandMap.mind.positioning) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Позиціонування:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.mind.positioning, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Unique Value
  if (brandMap.mind.uniqueValue) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Унікальна цінність:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.mind.uniqueValue, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 15;
  }

  // BODY SECTION
  checkPageBreak(30);
  pdf.setTextColor(16, 185, 129);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('⚙️ Тіло Бренду', margin, yPosition);
  yPosition += 12;

  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Практична реалізація та конкретні дії', margin, yPosition);
  yPosition += 15;

  // Products
  if (brandMap.body.products.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Продукти та послуги:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    brandMap.body.products.forEach((product, index) => {
      checkPageBreak(8);
      pdf.text(`• ${product}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Channels
  if (brandMap.body.channels.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Канали комунікації:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    brandMap.body.channels.forEach((channel, index) => {
      checkPageBreak(8);
      pdf.text(`• ${channel}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Visual Style
  if (brandMap.body.visualStyle) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Візуальний стиль:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(brandMap.body.visualStyle, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 8;
  }

  // Tone of Voice
  if (brandMap.body.toneOfVoice) {
    checkPageBreak(15);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Тон спілкування:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(brandMap.body.toneOfVoice, margin, yPosition);
    yPosition += 12;
  }

  // Actions
  if (brandMap.body.actions.length > 0) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Перші кроки для реалізації:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    brandMap.body.actions.forEach((action, index) => {
      checkPageBreak(8);
      pdf.text(`${index + 1}. ${action}`, margin + 5, yPosition);
      yPosition += 6;
    });
    yPosition += 5;
  }

  // Resources
  if (brandMap.body.resources) {
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Необхідні ресурси:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    yPosition = addText(Array.isArray(brandMap.body.resources) 
      ? brandMap.body.resources.join(', ')
      : brandMap.body.resources, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 15;
  }

  // Footer
  checkPageBreak(25);
  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;

  pdf.setTextColor(100, 100, 100);
  pdf.setFontSize(9);
  pdf.text('Створено за допомогою трансформаційної гри "Душа Бренду"', pageWidth / 2, yPosition, { align: 'center' });
  pdf.text('https://dusha-brendu.com', pageWidth / 2, yPosition + 5, { align: 'center' });

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Карта_Бренду_${timestamp}.pdf`;

  // Save the PDF
  pdf.save(filename);
};

// Helper function to format brand map data for sharing
export const formatBrandMapForSharing = (brandMap: BrandMap): string => {
  let shareText = "🎯 Моя карта бренду з гри 'Душа Бренду'\n\n";

  // Soul section
  shareText += "❤️ ДУША БРЕНДУ\n";
  if (brandMap.soul.mission) {
    shareText += `Місія: ${brandMap.soul.mission}\n`;
  }
  if (brandMap.soul.values.length > 0) {
    shareText += `Цінності: ${brandMap.soul.values.join(', ')}\n`;
  }
  shareText += "\n";

  // Mind section
  shareText += "🧠 РОЗУМ БРЕНДУ\n";
  if (brandMap.mind.brandIdea) {
    shareText += `Бренд-ідея: ${brandMap.mind.brandIdea}\n`;
  }
  if (brandMap.mind.archetype) {
    shareText += `Архетип: ${brandMap.mind.archetype}\n`;
  }
  shareText += "\n";

  // Body section
  shareText += "⚙️ ТІЛО БРЕНДУ\n";
  if (brandMap.body.channels.length > 0) {
    shareText += `Канали: ${brandMap.body.channels.join(', ')}\n`;
  }
  if (brandMap.body.toneOfVoice) {
    shareText += `Тон: ${brandMap.body.toneOfVoice}\n`;
  }

  shareText += "\n#ДушаБренду #BrandStrategy #Entrepreneurship";

  return shareText;
};

// Alternative export formats
export const exportToJSON = (brandMap: BrandMap, session: GameSession): void => {
  const data = {
    brandMap,
    session: {
      id: session.id,
      createdAt: session.createdAt,
      progress: session.progress,
      currentLevel: session.currentLevel,
    },
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brand-map-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToText = (brandMap: BrandMap): void => {
  const shareText = formatBrandMapForSharing(brandMap);
  
  const blob = new Blob([shareText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `brand-map-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
