export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const metrics = searchParams.get('metrics') || 'power,emissions';
  const interval = searchParams.get('interval') || '1h';
  const hours = parseInt(searchParams.get('hours') || '24', 10);

  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const baseUrl = 'https://api.openelectricity.org.au';
  const endpoint = '/data/network/NEM';
  const params = new URLSearchParams({
    metrics,
    interval,
    date_start: startTime,
    date_end: endTime,
  });

  const apiUrl = `${baseUrl}${endpoint}?${params.toString()}`;

  try {
    const apiKey = process.env.OPENNEM_API_KEY || 'oe_3ZToEwocKDaAxZ8FKRDjw2F7';
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'CoralCollective-App/1.0',
      },
      // Revalidate each request (avoid static caching during dev)
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ success: false, error: `OpenNEM API error: ${response.status}`, details: errorText }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, source: 'OpenNEM Real Data', timestamp: new Date().toISOString(), data }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message, source: 'Proxy Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}


