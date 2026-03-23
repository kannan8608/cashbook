import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToExcel(entries, groupTitle) {
  const rows = entries.map((e, i) => ({
    'SI No': i + 1,
    'Description': e.title,
    'Type': e.type === 'in' ? 'Cash In' : 'Cash Out',
    'Amount (₹)': e.amount,
    'Payment Mode': e.paymentMode,
    'Entered By': e.enteredByName,
    'Date': new Date(e.date).toLocaleString('en-IN'),
    'Note': e.note || '',
  }));

  const totalIn = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);

  rows.push({});
  rows.push({ 'SI No': '', 'Description': 'TOTAL CASH IN', 'Amount (₹)': totalIn });
  rows.push({ 'SI No': '', 'Description': 'TOTAL CASH OUT', 'Amount (₹)': totalOut });
  rows.push({ 'SI No': '', 'Description': 'NET BALANCE', 'Amount (₹)': totalIn - totalOut });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 6 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 20 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, groupTitle.substring(0, 31));
  XLSX.writeFile(wb, `${groupTitle}-cashbook.xlsx`);
}

export function exportToPDF(entries, groupTitle) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CashBook Report', 14, 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Group: ${groupTitle}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 35);

  const totalIn = entries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0);
  const balance = totalIn - totalOut;

  doc.setFontSize(10);
  doc.setFillColor(240, 253, 244);
  doc.rect(14, 40, 55, 14, 'F');
  doc.setTextColor(22, 163, 74);
  doc.text(`Total In: ₹${totalIn.toLocaleString()}`, 16, 49);

  doc.setFillColor(255, 241, 242);
  doc.rect(74, 40, 55, 14, 'F');
  doc.setTextColor(220, 38, 38);
  doc.text(`Total Out: ₹${totalOut.toLocaleString()}`, 76, 49);

  doc.setFillColor(219, 234, 254);
  doc.rect(134, 40, 62, 14, 'F');
  doc.setTextColor(balance >= 0 ? 22 : 220, balance >= 0 ? 163 : 38, balance >= 0 ? 74 : 38);
  doc.text(`Balance: ₹${balance.toLocaleString()}`, 136, 49);

  doc.setTextColor(0, 0, 0);

  autoTable(doc, {
    startY: 60,
    head: [['#', 'Description', 'Entered By', 'Date', 'Payment', 'Amount']],
    body: entries.map((e, i) => [
      i + 1,
      e.title + (e.note ? `\n${e.note}` : ''),
      e.enteredByName,
      new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      e.paymentMode,
      (e.type === 'in' ? '+ ' : '- ') + '₹' + e.amount.toLocaleString(),
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      3: { cellWidth: 28 },
      4: { cellWidth: 20 },
      5: { cellWidth: 24, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const entry = entries[data.row.index];
        if (entry) {
          doc.setTextColor(entry.type === 'in' ? 22 : 220, entry.type === 'in' ? 163 : 38, entry.type === 'in' ? 74 : 38);
        }
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const entry = entries[data.row.index];
        if (entry) {
          data.cell.styles.textColor = entry.type === 'in' ? [22, 163, 74] : [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  doc.save(`${groupTitle}-cashbook.pdf`);
}
