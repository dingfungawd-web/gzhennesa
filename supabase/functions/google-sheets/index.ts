import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateSessionToken = (token: string | null): boolean => {
  if (!token) return false;
  // Token should be 64 hex characters
  return /^[a-f0-9]{64}$/.test(token);
};

const validateUsername = (username: string | null): boolean => {
  if (!username) return false;
  if (username.length < 2 || username.length > 50) return false;
  // Allow alphanumeric, Chinese characters, underscores, hyphens
  return /^[\w\u4e00-\u9fa5-]+$/u.test(username);
};

const sanitizeString = (input: string): string => {
  if (!input) return '';
  // Limit length and escape potentially dangerous characters
  return input.slice(0, 1000)
    .replace(/[<>]/g, (char) => char === '<' ? '&lt;' : '&gt;');
};

const readAppsScriptResponse = async (response: Response) => {
  const text = await response.text().catch(() => '');
  if (!text) return { json: null as any, text: '' };
  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null as any, text };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const appsScriptUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
  
  if (!appsScriptUrl) {
    console.error('GOOGLE_APPS_SCRIPT_URL not configured');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Authentication: Extract session token from Authorization header
  const authHeader = req.headers.get('Authorization');
  const sessionToken = authHeader?.replace('Bearer ', '') || null;

  if (!validateSessionToken(sessionToken)) {
    console.error('Invalid or missing session token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Validate session with database
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: sessionData, error: sessionError } = await supabase
    .rpc('validate_session', { input_token: sessionToken });

  if (sessionError || !sessionData || sessionData.length === 0) {
    console.error('Session validation failed:', sessionError?.message || 'Invalid session');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authenticatedUser = sessionData[0];
  const authenticatedUsername = authenticatedUser.username;

  console.log('Authenticated user:', authenticatedUsername);

  try {
    if (req.method === 'GET') {
      const fetchUrl = `${appsScriptUrl}?username=${encodeURIComponent(authenticatedUsername)}`;
      console.log('Fetching reports for user:', authenticatedUsername);

      const upstream = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const { json, text } = await readAppsScriptResponse(upstream);

      if (!json) {
        console.error('Apps Script returned non-JSON (GET)', upstream.status, text.slice(0, 200));
        return new Response(JSON.stringify({
          error: 'Apps Script returned non-JSON response',
          status: upstream.status,
          body: text.slice(0, 500),
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!upstream.ok) {
        console.error('Apps Script error (GET)', upstream.status, json);
      }

      console.log('Apps Script response received');
      return new Response(JSON.stringify(json), {
        status: upstream.ok ? 200 : upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      const body = await req.json();

      if (!body || !body.rows || !Array.isArray(body.rows)) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sanitizedRows = body.rows.map((row: string[]) => {
        if (!Array.isArray(row)) {
          throw new Error('Invalid row format');
        }
        const sanitizedRow = row.map((cell, index) => {
          if (index === 0) {
            return authenticatedUsername;
          }
          return typeof cell === 'string' ? sanitizeString(cell) : String(cell || '');
        });
        return sanitizedRow;
      });

      console.log('Posting report for user:', authenticatedUsername);

      const upstream = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: sanitizedRows }),
      });

      const { json, text } = await readAppsScriptResponse(upstream);

      if (!json) {
        console.error('Apps Script returned non-JSON (POST)', upstream.status, text.slice(0, 200));
        return new Response(JSON.stringify({
          error: 'Apps Script returned non-JSON response',
          status: upstream.status,
          body: text.slice(0, 500),
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!upstream.ok) {
        console.error('Apps Script error (POST)', upstream.status, json);
      }

      console.log('Apps Script POST response received');
      return new Response(JSON.stringify(json), {
        status: upstream.ok ? 200 : upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'PUT') {
      const body = await req.json();

      if (!body || !body.reportCode || !body.rows || !Array.isArray(body.rows)) {
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const sanitizedRows = body.rows.map((row: string[]) => {
        if (!Array.isArray(row)) {
          throw new Error('Invalid row format');
        }
        const sanitizedRow = row.map((cell, index) => {
          if (index === 0) {
            return authenticatedUsername;
          }
          return typeof cell === 'string' ? sanitizeString(cell) : String(cell || '');
        });
        return sanitizedRow;
      });

      console.log('Updating report for user:', authenticatedUsername, 'reportCode:', body.reportCode);

      const upstream = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          reportCode: body.reportCode,
          username: authenticatedUsername,
          rows: sanitizedRows,
        }),
      });

      const { json, text } = await readAppsScriptResponse(upstream);

      if (!json) {
        console.error('Apps Script returned non-JSON (PUT/update)', upstream.status, text.slice(0, 200));
        return new Response(JSON.stringify({
          error: 'Apps Script returned non-JSON response',
          status: upstream.status,
          body: text.slice(0, 500),
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!upstream.ok) {
        console.error('Apps Script error (PUT/update)', upstream.status, json);
      }

      console.log('Apps Script UPDATE response received');
      return new Response(JSON.stringify(json), {
        status: upstream.ok ? 200 : upstream.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-sheets function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
