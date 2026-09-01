import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "SolaimanLipi",
  fonts: [
    {
      src: "/fonts/SolaimanLipi_22-02-2012.ttf",
      fontWeight: "normal",
    },
    {
      src: "/fonts/SolaimanLipi_Bold_10-03-12.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 15,
    fontSize: 8.25,
    fontFamily: "SolaimanLipi",
    flexDirection: "row",
  },
  half: {
    flex: 1,
    paddingHorizontal: 15,
    flexDirection: "column",
  },
  divider: {
    width: 0,
    borderLeftWidth: 1,
    borderLeftColor: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 3.75,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#333",
  },
  logo: {
    width: 37.5,
    height: 37.5,
    marginRight: 9,
  },
  brandName: {
    fontSize: 16.5,
    fontWeight: "bold",
  },
  contactSection: {
    marginTop: 3,
  },
  contactRow: {
    flexDirection: "row",
    marginTop: 1.5,
  },
  contactLabel: {
    fontSize: 6.75,
    color: "#666",
  },
  contactValue: {
    fontSize: 6.75,
    color: "#333",
  },
  copySection: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderTopColor: "#333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: "#666",
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  label: {
    color: "#666",
  },
  value: {
    fontWeight: "normal",
  },
  bold: {
    fontWeight: "bold",
  },
  table: {
    marginTop: 6,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  col1: { width: "60%" },
  col2: { width: "5%", textAlign: "center" },
  col3: { width: "17.5%", textAlign: "right" },
  col4: { width: "17.5%", textAlign: "right" },
  col5: { width: "17.5%", textAlign: "right" },
  headerText: {
    fontWeight: "bold",
    fontSize: 7.5,
  },
  totalSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1.5,
    borderTopColor: "#333",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 7.5,
    fontWeight: "bold",
  },
  twoColumns: {
    flexDirection: "row",
    gap: 15,
  },
  column: {
    flex: 1,
  },
});

const statusConfig = {
  Pending: { bg: "#fef3c7", color: "#92400e" },
  Confirmed: { bg: "#dbeafe", color: "#1e40af" },
  Shipped: { bg: "#e0f2fe", color: "#075985" },
  Delivered: { bg: "#dcfce7", color: "#166534" },
};

const SITE_NAME = "Pustidhara";
const CONTACT_MOBILE = process.env.NEXT_PUBLIC_CONTACT_MOBILE_NUMBER;
const CONTACT_ADDRESS = process.env.NEXT_PUBLIC_CONTACT_ADDRESS;

function formatCurrency(amount) {
  return new Intl.NumberFormat("bn-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default function EntryPDF({ entry }) {
  if (!entry) {
    return null;
  }

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <EntryPDFContent entry={entry} isCustomerCopy={true} />
        <View style={styles.divider} />
        <EntryPDFContent entry={entry} isCustomerCopy={false} />
      </Page>
    </Document>
  );
}

function EntryPDFContent({ entry, isCustomerCopy }) {
  const status = statusConfig[entry.orderStatus] || {
    bg: "#f3f4f6",
    color: "#374151",
  };

  return (
    <View style={styles.half}>
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image src="/logo.png" style={styles.logo} />
          <View>
            <Text style={styles.brandName}>{SITE_NAME}</Text>
            <View style={styles.contactSection}>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Mobile: </Text>
                <Text style={styles.contactValue}>{CONTACT_MOBILE}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactLabel}>Address: </Text>
                <Text style={styles.contactValue}>{CONTACT_ADDRESS}</Text>
              </View>
            </View>
          </View>
        </View>
        <View>
          <View style={styles.copySection}>
            <Text>{isCustomerCopy ? "Customer Copy" : "Office Copy"}</Text>
          </View>
          {entry.cnNumber && (
            <Text
              style={{
                fontSize: 16,
              }}
            >
              {entry.cnNumber}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginTop: 8,
            marginBottom: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#ddd",
          }}
        >
          <Text style={styles.sectionTitle}>
            Customer & Delivery Information
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {entry.orderStatus.charAt(0).toUpperCase() +
                entry.orderStatus.slice(1)}
            </Text>
          </View>
        </View>
        {entry.customer && (
          <>
            <View
              style={{
                flexDirection: "row",
                gap: 3,
                paddingVertical: 3,
              }}
            >
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{entry.customer.name}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 3,
                paddingVertical: 3,
              }}
            >
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{entry.customer.mobileNumber}</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 3,
                paddingVertical: 3,
              }}
            >
              <Text style={styles.label}>Address:</Text>
              <Text style={styles.value}>{entry.customer.address}</Text>
            </View>
          </>
        )}
        <View
          style={{
            flexDirection: "row",
            gap: 3,
            paddingVertical: 3,
          }}
        >
          <Text style={styles.label}>Shipping Method:</Text>
          <Text style={styles.value}>{entry.shippingMethod || "N/A"}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={[styles.col2, styles.headerText]}>Qty</Text>
            <Text style={[styles.col3, styles.headerText]}>Price</Text>
            <Text style={[styles.col4, styles.headerText]}>Discount</Text>
            <Text style={[styles.col5, styles.headerText]}>Total</Text>
          </View>
          {entry.products.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.col1}>
                {item.product?.name || `Product ${index + 1}`}
              </Text>
              <Text style={styles.col2}>{new Intl.NumberFormat("bn-BD").format(item.quantity)}</Text>
              <Text style={styles.col3}>{formatCurrency(item.sellPrice)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.discount)}</Text>
              <Text style={styles.col5}>{formatCurrency(item.subtotal)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>{formatCurrency(entry.subtotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Shipping Charge</Text>
          <Text style={styles.value}>
            {entry.shippingCustomer > 0
              ? formatCurrency(entry.shippingCustomer)
              : "Free"}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Discount</Text>
          <Text style={styles.value}>
            {formatCurrency(entry.totalDiscount)}
          </Text>
        </View>
        {entry.courierTax > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Courier Tax</Text>
            <Text style={styles.value}>{formatCurrency(entry.courierTax)}</Text>
          </View>
        )}
        <View style={[styles.row, styles.totalSection]}>
          <Text style={styles.bold}>Total</Text>
          <Text style={styles.bold}>
            {formatCurrency(
              entry.subtotal + entry.shippingCustomer - entry.overallDiscount,
            )}
          </Text>
        </View>
      </View>
      <View
        style={{
          marginTop: "auto",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <Text>Signature</Text>
      </View>
    </View>
  );
}
