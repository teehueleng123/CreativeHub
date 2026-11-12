import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server environment is not configured.' }, 500);
    }

    let token = new URL(req.url).searchParams.get('token')?.trim() || '';
    if (!token && req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      token = typeof body?.token === 'string' ? body.token.trim() : '';
    }

    if (!token) {
      return jsonResponse({ error: 'Missing share token.' }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: link, error: linkError } = await admin
      .from('share_links')
      .select(
        `
        id,
        permission,
        expires_at,
        revoked_at,
        access_count,
        resources (
          id,
          title,
          description,
          resource_kind,
          mime_type,
          file_name,
          file_size_bytes,
          file_extension,
          external_url,
          license_info,
          storage_path,
          created_at,
          categories ( name, color )
        )
      `
      )
      .eq('token', token)
      .maybeSingle();

    if (linkError) {
      return jsonResponse({ error: 'Unable to validate share link.' }, 500);
    }

    if (!link || !link.resources) {
      return jsonResponse({ error: 'Share link not found.' }, 404);
    }

    if (link.revoked_at) {
      return jsonResponse({ error: 'This share link has been revoked by its owner.' }, 410);
    }

    if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) {
      return jsonResponse({ error: 'This share link has expired.' }, 410);
    }

    await admin
      .from('share_links')
      .update({ access_count: (link.access_count || 0) + 1 })
      .eq('id', link.id);

    const resource = Array.isArray(link.resources) ? link.resources[0] : link.resources;

    let previewUrl: string | null = null;
    let downloadUrl: string | null = null;

    if (resource.resource_kind === 'file' && resource.storage_path) {
      const { data: previewData, error: previewErr } = await admin.storage
        .from('creative-assets')
        .createSignedUrl(resource.storage_path, 300);

      if (previewErr) {
        return jsonResponse({ error: 'Could not generate preview link.' }, 500);
      }
      previewUrl = previewData.signedUrl;

      if (link.permission === 'download') {
        const { data: downloadData, error: downloadErr } = await admin.storage
          .from('creative-assets')
          .createSignedUrl(resource.storage_path, 300, {
            download: resource.file_name || resource.title,
          });

        if (!downloadErr && downloadData) {
          downloadUrl = downloadData.signedUrl;
        }
      }
    }

    // Strip internal storage_path and personal_notes before returning to recipient
    const safeResource = {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      resource_kind: resource.resource_kind,
      mime_type: resource.mime_type,
      file_name: resource.file_name,
      file_size_bytes: resource.file_size_bytes,
      file_extension: resource.file_extension,
      external_url: resource.external_url,
      license_info: resource.license_info,
      created_at: resource.created_at,
      categories: resource.categories,
    };

    return jsonResponse({
      permission: link.permission,
      expires_at: link.expires_at,
      resource: safeResource,
      previewUrl,
      downloadUrl,
    });
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : 'Unexpected error.' }, 500);
  }
});
