interface BillPdfItem {
  item_type: string;
  name: string;
  description?: string;
  number_of_units: number;
  source_unit?: string;
  quantity: number;
  target_unit?: string;
  unit: string;
  unit_price: number;
  amount: number;
  width?: number;
  height?: number;
  depth?: number;
  length?: number;
  breadth?: number;
}

interface BillPdfData {
  billNumber: string;
  status: string;
  createdAt: string;
  projectName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerLocation: string;
  designerName?: string;
  designerSpecialization?: string;
  items: BillPdfItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  versionNumber?: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getItemTypeLabel(type: string): string {
  switch (type) {
    case 'material': return 'Material';
    case 'labor': return 'Labor';
    case 'service': return 'Service';
    case 'component': return 'Component';
    default: return 'Other';
  }
}

export function generateBillPdf(data: BillPdfData): void {
  const itemRows = data.items.map((item, i) => {
    const displayUnit = item.target_unit || item.unit;
    const dimInfo = (() => {
      const w = item.width ?? item.length;
      const h = item.height ?? item.breadth;
      const d = item.depth;
      if (w && h && item.source_unit) {
        const dims = d ? `${w} × ${h} × ${d}` : `${w} × ${h}`;
        return `<span class="desc">${dims} ${item.source_unit}</span>`;
      }
      return '';
    })();
    const qtyDisplay = Number(item.quantity).toFixed(3);
    const unitsLabel = item.number_of_units > 1 ? ` × ${item.number_of_units}` : '';
    return `
    <tr>
      <td>${i + 1}</td>
      <td>
        <strong>${item.name}</strong>
        ${item.description ? `<br/><span class="desc">${item.description}</span>` : ''}
        ${dimInfo ? `<br/>${dimInfo}` : ''}
      </td>
      <td>${getItemTypeLabel(item.item_type)}</td>
      <td class="center">${qtyDisplay} ${displayUnit}${unitsLabel}</td>
      <td class="right">${formatCurrency(item.unit_price)}</td>
      <td class="right">${formatCurrency(item.amount)}</td>
    </tr>
  `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Bill - ${data.billNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.5; padding: 40px; max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #0d9488; }
    .header-left h1 { font-size: 28px; color: #0d9488; margin-bottom: 4px; }
    .header-left p { font-size: 13px; color: #6b7280; }
    .header-right { text-align: right; }
    .header-right .bill-num { font-size: 16px; font-weight: 600; color: #1f2937; }
    .header-right .bill-date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .header-right .bill-status { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-draft { background: #f3f4f6; color: #4b5563; }
    .status-paid { background: #dcfce7; color: #166534; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
    .info-box { padding: 16px; border-radius: 8px; background: #f9fafb; border: 1px solid #e5e7eb; }
    .info-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
    .info-box p { font-size: 13px; margin-bottom: 3px; }
    .info-box .name { font-weight: 600; font-size: 15px; margin-bottom: 6px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    thead { background: #f3f4f6; }
    th { padding: 10px 12px; text-align: left; font-weight: 600; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
    td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    td .desc { font-size: 11px; color: #6b7280; }
    .center { text-align: center; }
    .right { text-align: right; }
    .totals { margin-left: auto; width: 280px; margin-bottom: 24px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals .row.total { border-top: 2px solid #0d9488; padding-top: 10px; margin-top: 6px; font-size: 16px; font-weight: 700; color: #0d9488; }
    .totals .row .label { color: #6b7280; }
    .totals .row .value { font-weight: 500; }
    .notes { padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 24px; }
    .notes h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin-bottom: 6px; font-weight: 600; }
    .notes p { font-size: 13px; color: #374151; }
    .footer { text-align: center; font-size: 11px; color: #9ca3af; padding-top: 20px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>BILL</h1>
      <p>${data.projectName}</p>
    </div>
    <div class="header-right">
      <div class="bill-num">${data.billNumber}</div>
      <div class="bill-date">${new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
      <span class="bill-status status-${data.status}">${data.status}</span>
      ${data.versionNumber ? `<div class="bill-date" style="margin-top:4px">Version ${data.versionNumber}</div>` : ''}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>Bill To</h3>
      <p class="name">${data.customerName}</p>
      <p>${data.customerEmail}</p>
      <p>${data.customerPhone}</p>
      <p>${data.customerLocation}</p>
    </div>
    ${data.designerName ? `
    <div class="info-box">
      <h3>From</h3>
      <p class="name">${data.designerName}</p>
      <p>${data.designerSpecialization || ''}</p>
    </div>
    ` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Item</th>
        <th>Type</th>
        <th class="center">Qty (Unit)</th>
        <th class="right">Rate</th>
        <th class="right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="row">
      <span class="label">Subtotal</span>
      <span class="value">&#8377; ${formatCurrency(data.subtotal)}</span>
    </div>
    ${data.discountAmount > 0 ? `
    <div class="row">
      <span class="label">Discount</span>
      <span class="value" style="color:#16a34a">- &#8377; ${formatCurrency(data.discountAmount)}</span>
    </div>
    ` : ''}
    <div class="row">
      <span class="label">Tax (${data.taxRate}%)</span>
      <span class="value">&#8377; ${formatCurrency(data.taxAmount)}</span>
    </div>
    <div class="row total">
      <span>Total</span>
      <span>&#8377; ${formatCurrency(data.totalAmount)}</span>
    </div>
  </div>

  ${data.notes ? `
  <div class="notes">
    <h3>Notes</h3>
    <p>${data.notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}
