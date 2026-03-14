import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  address: string | null
  city: string | null
}

interface DevisItem {
  id: string
  reference: string
  description: string | null
  quantity: number
  unit_price: number
  unit: string
  total_ht: number
}

interface Devis {
  id: string
  number: string
  created_at: string
  total_ht: number
  total_ttc: number
  status: 'en_attente' | 'accepte' | 'refuse'
  client_id: string
  client: Client
  items: DevisItem[]
}

interface UserData {
  company_name: string
  activity_type: string
  address: string
  postal_code: string
  city: string
  country: string
  phone: string
  logo_url: string | null
  siret: string | null
  rcs: string | null
  code_ape: string | null
  capital: number | null
  vat_number: string | null
}

interface DevisPDFProps {
  devis: Devis
  userData: UserData
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: 80,
    marginRight: 20,
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  headerRight: {
    flex: 1,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 6,
  },
  twoColumns: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    paddingRight: 15,
  },
  columnRight: {
    flex: 1,
    paddingLeft: 15,
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  value: {
    fontSize: 9,
    color: '#666',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderBottom: '1 solid #ddd',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #eee',
  },
  colReference: {
    width: '30%',
    fontSize: 9,
  },
  colUnite: {
    width: '10%',
    fontSize: 9,
    textAlign: 'center',
  },
  colQuantity: {
    width: '15%',
    fontSize: 9,
    textAlign: 'right',
  },
  colPrice: {
    width: '15%',
    fontSize: 9,
    textAlign: 'right',
  },
  colTotal: {
    width: '15%',
    fontSize: 9,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 6,
    width: '40%',
  },
  totalLabel: {
    fontSize: 9,
    width: '60%',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 9,
    width: '40%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  totalTTCRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2 solid #333',
    width: '40%',
  },
  totalTTCLabel: {
    fontSize: 12,
    width: '60%',
    textAlign: 'right',
    paddingRight: 10,
    fontWeight: 'bold',
  },
  totalTTCValue: {
    fontSize: 12,
    width: '40%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 8,
    color: '#666',
  },
  footerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  conditions: {
    marginTop: 30,
    fontSize: 9,
    lineHeight: 1.6,
  },
  conditionsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
})

export const DevisPDF: React.FC<DevisPDFProps> = ({ devis, userData }) => {
  const totalHT = devis.items.reduce((sum, item) => sum + item.total_ht, 0)
  const tva = devis.total_ttc - totalHT
  const tvaRate = totalHT > 0 ? ((tva / totalHT) * 100).toFixed(1) : '0'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header avec logo et nom entreprise */}
        <View style={styles.header}>
          {userData.logo_url && (
            <View style={styles.logoContainer}>
              <Image src={userData.logo_url} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{userData.company_name}</Text>
            <View style={styles.companyInfo}>
              <Text>{userData.address}</Text>
              <Text>
                {userData.postal_code} {userData.city}
              </Text>
              {userData.phone && <Text>Tél: {userData.phone}</Text>}
            </View>
          </View>
        </View>

        {/* Informations devis et client */}
        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>DEVIS</Text>
            <Text style={styles.label}>N°:</Text>
            <Text style={styles.value}>{devis.number}</Text>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {format(new Date(devis.created_at), 'd MMMM yyyy', { locale: fr })}
            </Text>
            <Text style={styles.label}>Statut:</Text>
            <Text style={styles.value}>
              {devis.status === 'en_attente' && 'En attente'}
              {devis.status === 'accepte' && 'Accepté'}
              {devis.status === 'refuse' && 'Refusé'}
            </Text>
          </View>
          <View style={styles.columnRight}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            <Text style={styles.value}>
              {devis.client.first_name} {devis.client.last_name}
            </Text>
            {devis.client.phone && (
              <Text style={styles.value}>Tél: {devis.client.phone}</Text>
            )}
            {(devis.client.address || devis.client.city) && (
              <Text style={styles.value}>
                {devis.client.address}
                {devis.client.address && devis.client.city && ', '}
                {devis.client.city}
              </Text>
            )}
          </View>
        </View>

        {/* Tableau des lignes */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colReference}>Désignation</Text>
            <Text style={styles.colUnite}>Unité</Text>
            <Text style={styles.colQuantity}>Quantité</Text>
            <Text style={styles.colPrice}>Prix unitaire</Text>
            <Text style={styles.colTotal}>Total HT</Text>
          </View>
          {devis.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colReference}>
                <Text>{item.reference}</Text>
                {item.description && (
                  <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={styles.colUnite}>{item.unit}</Text>
              <Text style={styles.colQuantity}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.colPrice}>{item.unit_price.toFixed(2)} €</Text>
              <Text style={styles.colTotal}>{item.total_ht.toFixed(2)} €</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>{totalHT.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA ({tvaRate}%):</Text>
            <Text style={styles.totalValue}>{tva.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalTTCRow}>
            <Text style={styles.totalTTCLabel}>Total TTC:</Text>
            <Text style={styles.totalTTCValue}>{devis.total_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Conditions de règlement */}
        <View style={styles.conditions}>
          <Text style={styles.conditionsTitle}>Conditions de règlement :</Text>
          <Text>40% à la signature du devis</Text>
          <Text>30% en cours des travaux</Text>
          <Text>30% en fin des travaux</Text>
        </View>

        {/* Footer avec informations légales */}
        <View style={styles.footer}>
          {userData.siret && (
            <View style={styles.footerRow}>
              <Text>SIRET: {userData.siret}</Text>
            </View>
          )}
          {userData.rcs && (
            <View style={styles.footerRow}>
              <Text>RCS: {userData.rcs}</Text>
            </View>
          )}
          {userData.code_ape && (
            <View style={styles.footerRow}>
              <Text>Code APE: {userData.code_ape}</Text>
            </View>
          )}
          {userData.capital && (
            <View style={styles.footerRow}>
              <Text>Capital: {userData.capital.toFixed(2)} €</Text>
            </View>
          )}
          {userData.vat_number && (
            <View style={styles.footerRow}>
              <Text>TVA: {userData.vat_number}</Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
