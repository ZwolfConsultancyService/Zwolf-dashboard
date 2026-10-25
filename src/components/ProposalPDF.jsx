import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#fff' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#1e293b' },
  section: { margin: 10, padding: 10, flexGrow: 1 },
  label: { fontSize: 12, fontWeight: 'bold', marginTop: 10, color: '#475569' },
  text: { fontSize: 11, marginBottom: 5, color: '#0f172a' },
  divider: { borderBottomWidth: 1, borderColor: '#e2e8f0', marginVertical: 10 },
});

const ProposalPDF = ({ proposal }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>PROPOSAL: {proposal.proposalNumber}</Text>
      <View style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.label}>Project Name:</Text>
        <Text style={styles.text}>{proposal.projectName}</Text>

        <Text style={styles.label}>Total Amount:</Text>
        <Text style={styles.text}>₹ {Number(proposal.totalAmount || 0).toLocaleString('en-IN')}</Text>

        <Text style={styles.label}>Payment Terms:</Text>
        <Text style={styles.text}>{proposal.paymentTerms || 'N/A'}</Text>

        <Text style={styles.label}>Description:</Text>
        <Text style={styles.text}>{proposal.description || 'N/A'}</Text>
        
        {proposal.scopeOfWork && proposal.scopeOfWork.length > 0 && (
          <View>
            <Text style={styles.label}>Scope of Work:</Text>
            {proposal.scopeOfWork.map((item, index) => (
              <Text key={index} style={styles.text}>• {item}</Text>
            ))}
          </View>
        )}
      </View>
    </Page>
  </Document>
);

export default ProposalPDF;