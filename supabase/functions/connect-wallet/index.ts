
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nacl from 'https://cdn.skypack.dev/tweetnacl';
import { Buffer } from 'https://deno.land/std@0.177.0/node/buffer.ts';
import { decode } from 'https://deno.land/std@0.177.0/encoding/base58.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { publicKey, signature, message } = await req.json();

    if (!publicKey || !signature || !message) {
      throw new Error("Missing required parameters: publicKey, signature, message.");
    }

    // 1. Verify the wallet signature
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyUint8Array = decode(publicKey);
    const signatureBytes = Buffer.from(signature, 'base64');
    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyUint8Array);

    if (!isVerified) {
      return new Response(JSON.stringify({ error: 'Invalid signature.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 2. Signature is valid. Initialize Admin Client.
    const supabaseAdmin = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const userEmail = `${publicKey}@phantom.app`;
    const userPassword = publicKey; // Using the public key as a deterministic password
    let isNewUser = false;
    let userId: string;

    // 3. Check if user exists using their deterministic email.
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserByEmail(userEmail);

    if (getUserError && getUserError.message.includes("User not found")) {
      // 4a. User does not exist, so create them.
      isNewUser = true;
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: userPassword,
        email_confirm: true, // Auto-confirm because we verified the wallet signature
        user_metadata: { wallet_address: publicKey }
      });

      if (createError) throw new Error(`User creation failed: ${createError.message}`);
      userId = createData.user.id;
      
      // Also create their public profile.
      const base_username = `sol-${publicKey.slice(0, 4)}-${publicKey.slice(-4)}`;
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: userId,
        username: base_username,
        wallet_address: publicKey,
      });

      if (profileError) {
        // If profile creation fails, roll back the auth user to prevent orphaned users.
        await supabaseAdmin.auth.admin.deleteUser(userId);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }
    } else if (getUserError) {
        throw new Error(`Error fetching user: ${getUserError.message}`);
    } else {
      // 4b. User exists.
      userId = userData.user.id;
    }

    // 5. Now that we have a guaranteed user, sign them in to get a fresh session.
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: userEmail,
      password: userPassword,
    });

    if (signInError) throw new Error(`Authentication failed: ${signInError.message}`);
    if (!signInData.session) throw new Error("Could not establish a session.");

    // 6. Return the session tokens to the client.
    return new Response(JSON.stringify({
      accessToken: signInData.session.access_token,
      refreshToken: signInData.session.refresh_token,
      isNewUser: isNewUser,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
