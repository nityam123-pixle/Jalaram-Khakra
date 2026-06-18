import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#112131',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  companyInfo: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  billTo: {
    width: '50%',
  },
  billToTitle: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  billToName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  billToText: {
    fontSize: 10,
    color: '#333',
  },
  metaContainer: {
    width: '40%',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: '#666',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableColHeaderItem: {
    width: '40%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableColHeaderQty: {
    width: '15%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableColHeaderRate: {
    width: '20%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableColHeaderAmt: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableColItem: {
    width: '40%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableColQty: {
    width: '15%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableColRate: {
    width: '20%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableColAmt: {
    width: '25%',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
  },
  tableCellNum: {
    margin: 5,
    fontSize: 10,
    textAlign: 'right',
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsBox: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  totalsLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingTop: 5,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#666',
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  signatureContainer: {
    marginTop: 50,
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: '#333',
    marginRight: 20,
  }
});

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerPhone?: string;
  items: {
    name: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
}

const InvoiceDocument = ({ data }: { data: InvoiceData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>Jalaram Khakhra</Text>
          <Text style={styles.companyInfo}>Proprietor: Dharmesh Suchak</Text>
          <Text style={styles.companyInfo}>BLOCK 308 GREEN LIFE APPARTMENT AMRUTDHARA 5</Text>
          <Text style={styles.companyInfo}>OPP PATEL SANKUL CHAKKARGADH ROAD, AMRELI, 365601, GUJARAT</Text>
          <Text style={styles.companyInfo}>Phone: +91 98250 83947 | GSTIN: 24XXXXXXXXXX</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.billTo}>
          <Text style={styles.billToTitle}>BILL TO:</Text>
          <Text style={styles.billToName}>{data.customerName}</Text>
          {data.customerAddress ? <Text style={styles.billToText}>{data.customerAddress}</Text> : <View/>}
          <Text style={styles.billToText}>{data.customerCity}</Text>
          {data.customerPhone ? <Text style={styles.billToText}>Phone: {data.customerPhone}</Text> : <View/>}
        </View>
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice No:</Text>
            <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Invoice Date:</Text>
            <Text style={styles.metaValue}>{data.invoiceDate}</Text>
          </View>
          {data.dueDate ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due Date:</Text>
              <Text style={styles.metaValue}>{data.dueDate}</Text>
            </View>
          ) : <View/>}
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeaderItem}>
            <Text style={styles.tableCellHeader}>Item Description</Text>
          </View>
          <View style={styles.tableColHeaderQty}>
            <Text style={styles.tableCellHeader}>Qty</Text>
          </View>
          <View style={styles.tableColHeaderRate}>
            <Text style={styles.tableCellHeader}>Rate (Rs)</Text>
          </View>
          <View style={styles.tableColHeaderAmt}>
            <Text style={styles.tableCellHeader}>Amount (Rs)</Text>
          </View>
        </View>

        {/* Table Rows */}
        {data.items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableColItem}>
              <Text style={styles.tableCell}>{item.name}</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={styles.tableCellNum}>{item.quantity}</Text>
            </View>
            <View style={styles.tableColRate}>
              <Text style={styles.tableCellNum}>{item.rate.toFixed(2)}</Text>
            </View>
            <View style={styles.tableColAmt}>
              <Text style={styles.tableCellNum}>{item.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{data.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text style={styles.totalsValue}>{data.tax.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total (INR)</Text>
            <Text style={styles.totalValue}>{data.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Signature */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureLine}></View>
        <Text style={styles.signatureText}>Authorized Signature</Text>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Thank you for your business! Generated automatically by Khakhra Orders.
      </Text>
    </Page>
  </Document>
);

export async function renderInvoiceToStream(invoiceData: InvoiceData): Promise<NodeJS.ReadableStream> {
  return await renderToStream(<InvoiceDocument data={invoiceData} />);
}

export interface MonthlyStatementData {
  statementMonth: string;
  statementDate: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerPhone?: string;
  orders: {
    orderNumber: string;
    orderDate: string;
    total: number;
  }[];
  totalAmount: number;
  totalOrders: number;
}

const MonthlyStatementDocument = ({ data }: { data: MonthlyStatementData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>Jalaram Khakhra</Text>
          <Text style={styles.companyInfo}>Proprietor: Dharmesh Suchak</Text>
          <Text style={styles.companyInfo}>BLOCK 308 GREEN LIFE APPARTMENT AMRUTDHARA 5</Text>
          <Text style={styles.companyInfo}>OPP PATEL SANKUL CHAKKARGADH ROAD, AMRELI, 365601, GUJARAT</Text>
          <Text style={styles.companyInfo}>Phone: +91 98250 83947</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>STATEMENT</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'right', marginTop: 5 }}>{data.statementMonth}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.billTo}>
          <Text style={styles.billToTitle}>STATEMENT FOR:</Text>
          <Text style={styles.billToName}>{data.customerName}</Text>
          {data.customerAddress ? <Text style={styles.billToText}>{data.customerAddress}</Text> : <View/>}
          <Text style={styles.billToText}>{data.customerCity}</Text>
          {data.customerPhone ? <Text style={styles.billToText}>Phone: {data.customerPhone}</Text> : <View/>}
        </View>
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date Issued:</Text>
            <Text style={styles.metaValue}>{data.statementDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Total Orders:</Text>
            <Text style={styles.metaValue}>{data.totalOrders}</Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeaderItem, { width: '40%' }]}>
            <Text style={styles.tableCellHeader}>Order ID</Text>
          </View>
          <View style={[styles.tableColHeaderQty, { width: '30%' }]}>
            <Text style={styles.tableCellHeader}>Date</Text>
          </View>
          <View style={[styles.tableColHeaderAmt, { width: '30%' }]}>
            <Text style={styles.tableCellHeader}>Amount (Rs)</Text>
          </View>
        </View>

        {data.orders.map((order, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.tableColItem, { width: '40%' }]}>
              <Text style={styles.tableCell}>{order.orderNumber}</Text>
            </View>
            <View style={[styles.tableColQty, { width: '30%' }]}>
              <Text style={styles.tableCell}>{order.orderDate}</Text>
            </View>
            <View style={[styles.tableColAmt, { width: '30%' }]}>
              <Text style={styles.tableCellNum}>{order.total.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totalsContainer}>
        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due (INR)</Text>
            <Text style={styles.totalValue}>{data.totalAmount.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Thank you for your business! Generated automatically by Khakhra Orders.
      </Text>
    </Page>
  </Document>
);

export async function renderMonthlyStatementToStream(statementData: MonthlyStatementData): Promise<NodeJS.ReadableStream> {
  return await renderToStream(<MonthlyStatementDocument data={statementData} />);
}

export interface GlobalMonthlyReportData {
  reportMonth: string;
  generatedDate: string;
  totalRevenue: number;
  totalOrders: number;
  totalProductsSold: number;
  productSummary: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  orders: {
    orderNumber: string;
    date: string;
    customerName: string;
    city: string;
    amount: number;
  }[];
}

const GlobalMonthlyReportDocument = ({ data }: { data: GlobalMonthlyReportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.companyName}>Jalaram Khakhra</Text>
          <Text style={styles.companyInfo}>MONTHLY EXECUTIVE REPORT</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>{data.reportMonth}</Text>
          <Text style={{ fontSize: 10, color: '#666', textAlign: 'right', marginTop: 5 }}>Generated: {data.generatedDate}</Text>
        </View>
      </View>

      <View style={[styles.detailsContainer, { marginBottom: 20 }]}>
        <View style={styles.metaContainer}>
          <Text style={styles.billToTitle}>SUMMARY INSIGHTS</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Total Revenue:</Text>
            <Text style={styles.metaValue}>Rs. {data.totalRevenue.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Total Orders:</Text>
            <Text style={styles.metaValue}>{data.totalOrders}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Products Sold:</Text>
            <Text style={styles.metaValue}>{data.totalProductsSold}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.billToName, { marginBottom: 10, marginTop: 10 }]}>Product Sales Summary</Text>
      <View style={[styles.table, { marginBottom: 20 }]}>
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeaderItem, { width: '60%' }]}>
            <Text style={styles.tableCellHeader}>Product Name</Text>
          </View>
          <View style={[styles.tableColHeaderQty, { width: '20%' }]}>
            <Text style={styles.tableCellHeader}>Qty Sold</Text>
          </View>
          <View style={[styles.tableColHeaderAmt, { width: '20%' }]}>
            <Text style={styles.tableCellHeader}>Revenue</Text>
          </View>
        </View>
        {data.productSummary.map((item, idx) => (
          <View style={styles.tableRow} key={idx}>
            <View style={[styles.tableColItem, { width: '60%' }]}>
              <Text style={styles.tableCell}>{item.name}</Text>
            </View>
            <View style={[styles.tableColQty, { width: '20%' }]}>
              <Text style={styles.tableCellNum}>{item.quantity}</Text>
            </View>
            <View style={[styles.tableColAmt, { width: '20%' }]}>
              <Text style={styles.tableCellNum}>{item.revenue.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.billToName, { marginBottom: 10 }]}>All Orders in {data.reportMonth}</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeaderItem, { width: '20%' }]}>
            <Text style={styles.tableCellHeader}>Date</Text>
          </View>
          <View style={[styles.tableColHeaderItem, { width: '20%' }]}>
            <Text style={styles.tableCellHeader}>Order ID</Text>
          </View>
          <View style={[styles.tableColHeaderItem, { width: '40%' }]}>
            <Text style={styles.tableCellHeader}>Customer</Text>
          </View>
          <View style={[styles.tableColHeaderAmt, { width: '20%' }]}>
            <Text style={styles.tableCellHeader}>Amount (Rs)</Text>
          </View>
        </View>
        {data.orders.map((o, idx) => (
          <View style={styles.tableRow} key={idx}>
            <View style={[styles.tableColItem, { width: '20%' }]}>
              <Text style={styles.tableCell}>{o.date}</Text>
            </View>
            <View style={[styles.tableColItem, { width: '20%' }]}>
              <Text style={styles.tableCell}>{o.orderNumber}</Text>
            </View>
            <View style={[styles.tableColItem, { width: '40%' }]}>
              <Text style={styles.tableCell}>{o.customerName} ({o.city})</Text>
            </View>
            <View style={[styles.tableColAmt, { width: '20%' }]}>
              <Text style={styles.tableCellNum}>{o.amount.toFixed(2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        Confidential Executive Report | Generated automatically by Khakhra Orders.
      </Text>
    </Page>
  </Document>
);

export async function renderGlobalMonthlyReportToStream(reportData: GlobalMonthlyReportData): Promise<NodeJS.ReadableStream> {
  return await renderToStream(<GlobalMonthlyReportDocument data={reportData} />);
}
