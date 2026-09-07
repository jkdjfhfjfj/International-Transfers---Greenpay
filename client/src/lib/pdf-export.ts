import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatNumber, getCurrencySymbol } from './formatters';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  description?: string;
  fee?: string | number;
  reference?: string;
  paystackReference?: string;
  failureReason?: string;
  exchangeRate?: string | number;
  metadata?: Record<string, any>;
  recipientDetails?: {
    name?: string;
    [key: string]: any;
  };
}

interface UserData {
  fullName?: string;
  email?: string;
  phone?: string;
}

export function generateTransactionPDF(transactions: Transaction[], userData: UserData) {
  const doc = new jsPDF();
  
  const greenColor: [number, number, number] = [34, 197, 94]; // Green-500
  const grayColor: [number, number, number] = [107, 114, 128]; // Gray-500
  const darkColor: [number, number, number] = [17, 24, 39]; // Gray-900
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header with Geepay branding
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Geepay Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Geepay', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('International Money Transfer & Digital Wallet', 14, 28);
  
  // Statement title
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Statement', 14, 55);
  
  // User Information
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.text(`Generated: ${currentDate}`, 14, 65);
  if (userData.fullName) {
    doc.text(`Account Holder: ${userData.fullName}`, 14, 71);
  }
  if (userData.email) {
    doc.text(`Email: ${userData.email}`, 14, 77);
  }
  
  // Summary Statistics - group by all currencies present
  const currencies = [...new Set(transactions.map(t => t.currency?.toUpperCase() || 'USD'))];
  
  const currencyStats = currencies.map(cur => {
    const curTxns = transactions.filter(t => (t.currency?.toUpperCase() || 'USD') === cur);
    const totalIn = curTxns
      .filter(t => (t.type === 'receive' || t.type === 'deposit') && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalOut = curTxns
      .filter(t => ['send', 'withdraw', 'card_purchase', 'exchange', 'transfer', 'bill_payment', 'airtime'].includes(t.type) && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalFees = curTxns.reduce((sum, t) => sum + Number(t.fee ?? t.metadata?.fee ?? 0), 0);
    return { cur, sym: getCurrencySymbol(cur), totalIn, totalOut, totalFees };
  });
  
  // Summary Box — height grows with number of currencies
  const summaryBoxH = Math.max(35, 20 + currencyStats.length * 8);
  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(14, 85, pageWidth - 28, summaryBoxH);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('Summary', 18, 92);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  
  let yPos = 100;
  
   for (const { cur, sym, totalIn, totalOut, totalFees } of currencyStats) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`${cur}:`, 18, yPos);
    doc.setTextColor(34, 197, 94); // Green for income
    doc.text(`+${sym}${formatNumber(totalIn)}`, 50, yPos);
    doc.setTextColor(239, 68, 68); // Red for expenses
    doc.text(`-${sym}${formatNumber(totalOut)}`, 90, yPos);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Fees ${sym}${formatNumber(totalFees)}`, 135, yPos);
    yPos += 6;
  }
  
  // Transaction Table — start below summary box
  const tableStartY = 85 + summaryBoxH + 10;
  const tableData = transactions.map(transaction => {
     const date = new Date(transaction.completedAt || transaction.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const recipientName = transaction.recipientDetails?.name || 
      (transaction.type === 'deposit' ? 'Wallet Top-up' : 
       transaction.type === 'withdraw' ? 'Bank Withdrawal' : 
       transaction.type === 'card_purchase' ? 'Virtual Card' :
       transaction.type === 'exchange' ? 'Currency Exchange' : 'Transaction');
    
    const prefix = (transaction.type === 'send' || transaction.type === 'withdraw' || 
                    transaction.type === 'card_purchase' || transaction.type === 'exchange') ? '-' : '+';
    
     const fee = Number(transaction.fee ?? transaction.metadata?.fee ?? 0);
     const outgoing = ['send', 'withdraw', 'card_purchase', 'exchange', 'transfer', 'bill_payment', 'airtime'].includes(transaction.type);
     const total = outgoing ? Number(transaction.amount) + fee : Number(transaction.amount) - fee;
     const amount = `${prefix}${getCurrencySymbol(transaction.currency)}${formatNumber(transaction.amount)}`;
     const recipientDetails = transaction.recipientDetails || {};
     const contact = Object.entries(recipientDetails)
       .filter(([key, value]) => key !== 'name' && value != null && value !== '')
       .map(([, value]) => String(value))
       .join(' · ');
     const providerReference = transaction.paystackReference || transaction.metadata?.providerReference || transaction.metadata?.providerTransactionId || '';
    
    return [
       date,
       transaction.reference || transaction.id,
      recipientName,
       contact || transaction.description || '',
      amount,
       `${getCurrencySymbol(transaction.currency)}${formatNumber(fee)}`,
       `${getCurrencySymbol(transaction.currency)}${formatNumber(total)}`,
      transaction.currency?.toUpperCase() || 'USD',
       transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
       providerReference
    ];
  });
  
  autoTable(doc, {
    startY: tableStartY,
     head: [['Date', 'TID / Reference', 'Description', 'Contact / Details', 'Amount', 'Fee', 'Net / Total', 'Currency', 'Status', 'Provider Ref']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: greenColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
       0: { cellWidth: 19 },
       1: { cellWidth: 25 },
       2: { cellWidth: 28 },
       3: { cellWidth: 25 },
       4: { cellWidth: 22, halign: 'right' },
       5: { cellWidth: 16, halign: 'right' },
       6: { cellWidth: 22, halign: 'right' },
       7: { cellWidth: 16, halign: 'center' },
       8: { cellWidth: 20, halign: 'center' },
       9: { cellWidth: 25 }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      
      doc.text(
        'Geepay - Trusted International Money Transfer Service',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      
      doc.setFontSize(7);
      doc.text(
        'support@geepay.us | www.geepay.us',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }
  });
  
  // Save the PDF
  const fileName = `Geepay_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
