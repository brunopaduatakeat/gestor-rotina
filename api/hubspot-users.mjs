const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * GET /api/hubspot/users
 * Retorna owners (usuários) do HubSpot para pré-preencher o cadastro de Equipe.
 * Requer env: HUBSPOT_PRIVATE_APP_TOKEN
 */
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }

  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN
  if (!token) {
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: [], error: 'HUBSPOT_NOT_CONFIGURED' }),
    }
  }

  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/owners?limit=100&archived=false', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('HubSpot owners error:', res.status, text)
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: [], error: `HUBSPOT_${res.status}` }),
      }
    }

    const data = await res.json()
    const users = (data.results ?? []).map((o) => ({
      id:        o.id,
      firstName: o.firstName ?? '',
      lastName:  o.lastName  ?? '',
      email:     o.email     ?? '',
      name:      [o.firstName, o.lastName].filter(Boolean).join(' ') || o.email,
    }))

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    }
  } catch (err) {
    console.error('hubspot-users error:', err)
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: [], error: err.message }),
    }
  }
}
