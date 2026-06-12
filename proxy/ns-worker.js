/**
 * NS storingen-proxy (Cloudflare Worker)
 * ---------------------------------------
 * Haalt actieve trein-storingen op bij de NS Reisinformatie-API en geeft ze
 * door aan het dashboard. De NS-sleutel blijft server-side (als secret) en de
 * Worker voegt CORS toe, zodat de statische PWA de data wél mag ophalen.
 *
 * De app verwacht JSON: een array met objecten zoals { type, title, timespans:[{situation:{label}}] }.
 * De NS /disruptions/v3-respons is precies zo'n array, dus we geven 'm ongewijzigd door.
 *
 * Benodigde secret/variable in de Worker:  NS_API_KEY  (je gratis NS-sleutel)
 * Zie proxy/README-NS-proxy.md voor de stap-voor-stap deploy-uitleg.
 */

const NS_DISRUPTIONS_URL = 'https://gateway.apiportal.ns.nl/disruptions/v3?isActive=true';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const key = env.NS_API_KEY;
    if (!key) {
      return new Response(JSON.stringify({ error: 'NS_API_KEY ontbreekt in de Worker-instellingen' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    try {
      const nsRes = await fetch(NS_DISRUPTIONS_URL, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Accept': 'application/json',
        },
        // Cloudflare-edge cache: 2 minuten, scheelt NS-aanvragen
        cf: { cacheTtl: 120, cacheEverything: true },
      });

      if (!nsRes.ok) {
        const text = await nsRes.text();
        return new Response(JSON.stringify({ error: `NS API ${nsRes.status}`, detail: text.slice(0, 300) }), {
          status: nsRes.status,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const data = await nsRes.json();
      return new Response(JSON.stringify(data), {
        headers: {
          ...cors,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=120',
        },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Proxy-fout', detail: String(err) }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
