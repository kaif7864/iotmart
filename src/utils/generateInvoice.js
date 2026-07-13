import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order, user, currency = { code: 'INR', symbol: '₹', rate: 1 }) => {
  const doc = new jsPDF();
  
  // Colors and styling
  const primaryColor = [37, 99, 235]; // Blue-600
  const textColor = [51, 65, 85]; // Slate-700
  const lightGray = [241, 245, 249]; // Slate-100

  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('IoTMart Industrial', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('TAX INVOICE', 160, 25);

  // Reset Text Color
  doc.setTextColor(...textColor);

  // Company Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 15, 55);
  doc.setFont('helvetica', 'normal');
  doc.text(['IoTMart Tech Pvt. Ltd.', 'Tech Park, Sector 62', 'Noida, UP 201309', 'GSTIN: 09AAECI0987K1Z4'], 15, 62);

  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 120, 55);
  doc.setFont('helvetica', 'normal');
  doc.text([
    user?.name || 'Guest User',
    user?.email || 'N/A',
    order?.shippingAddress || 'Digital Delivery'
  ], 120, 62);

  // Invoice Details
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', 15, 90);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${order?._id || 'ORD-' + Math.floor(Math.random()*10000)}`, 15, 97);
  doc.text(`Date: ${new Date(order?.createdAt || Date.now()).toLocaleDateString()}`, 15, 104);
  doc.text(`Payment: ${order?.paymentStatus || 'Completed'}`, 15, 111);

  // Items Table
  const tableColumn = ["Item", "Unit Price", "Qty", "Total"];
  const tableRows = [];

  let subtotal = 0;
  
  const items = order?.items || [{ name: 'Sample Item', price: 999, quantity: 1 }];

  const safeSymbol = currency.symbol === '₹' ? 'Rs.' : currency.symbol;

  items.forEach(item => {
    const price = (item.price * currency.rate).toFixed(2);
    const total = (item.price * item.quantity * currency.rate).toFixed(2);
    subtotal += parseFloat(total);
    
    tableRows.push([
      item.name,
      `${safeSymbol}${price}`,
      item.quantity,
      `${safeSymbol}${total}`
    ]);
  });

  // Calculate GST (18%)
  const gst = subtotal * 0.18;
  const finalTotal = subtotal + gst;

  autoTable(doc, {
    startY: 125,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    alternateRowStyles: { fillColor: lightGray },
    margin: { top: 125 }
  });

  // Totals Area
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, finalY);
  doc.text('GST (18%):', 140, finalY + 7);
  doc.text('Grand Total:', 140, finalY + 14);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${safeSymbol}${subtotal.toFixed(2)}`, 180, finalY, { align: 'right' });
  doc.text(`${safeSymbol}${gst.toFixed(2)}`, 180, finalY + 7, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(`${safeSymbol}${finalTotal.toFixed(2)}`, 180, finalY + 14, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Thank you for shopping with IoTMart. This is a computer generated invoice.', 105, 280, { align: 'center' });

  // Save the PDF
  doc.save(`IoTMart_Invoice_${order?._id || 'Draft'}.pdf`);
};
