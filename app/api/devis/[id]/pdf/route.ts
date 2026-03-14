import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToStream } from '@react-pdf/renderer'
import { DevisPDF } from '@/components/pdf/devis-pdf'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const userId = authData.user.id

    // Récupérer le devis avec ses lignes
    const { data: devisData, error: devisError } = await supabase
      .from('devis')
      .select(`
        id,
        number,
        created_at,
        total_ht,
        total_ttc,
        status,
        client_id
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (devisError || !devisData) {
      return NextResponse.json({ error: 'Devis non trouvé' }, { status: 404 })
    }

    // Récupérer les lignes du devis
    const { data: itemsData, error: itemsError } = await supabase
      .from('devis_items')
      .select('*')
      .eq('devis_id', id)
      .order('created_at', { ascending: true })

    if (itemsError) {
      console.error('Erreur lors de la récupération des lignes:', itemsError)
    }

    // Récupérer le client
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, phone, address, city')
      .eq('id', devisData.client_id)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Récupérer les données utilisateur
    const { data: userData, error: userDataError } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'Données utilisateur non trouvées' }, { status: 404 })
    }

    // Préparer les données pour le PDF
    const devis = {
      ...devisData,
      client: clientData,
      items: itemsData || [],
    }

    // Générer le PDF
    const pdfStream = await renderToStream(
      React.createElement(DevisPDF, { devis, userData }) as any
    )
    

    // Convertir le stream en buffer
    const chunks: Buffer[] = []
    for await (const chunk of pdfStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const pdfBuffer = Buffer.concat(chunks)

    // Vérifier si c'est une prévisualisation ou un téléchargement
    const { searchParams } = new URL(request.url)
    const isPreview = searchParams.get('preview') === 'true'
    const disposition = isPreview ? 'inline' : 'attachment'

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${disposition}; filename="devis-${devis.number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
