import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nacl from 'https://cdn.skypack.dev/tweetnacl';
import { Buffer } from 'https://deno.land/std@0.177.0/node/buffer.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { publicKey, signature, message } = await req.json();

    // 1. Verify the signature
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = new Buffer(publicKey, 'base64'); // Assuming FE sends base58 string, but for verification we need raw bytes. Wallet pubkey is NOT base64. Let's adapt.
    // Phantom wallet public keys are base58 encoded. We need a library for that.
    // For simplicity, let's assume the public key itself can be used if we find a compatible signature scheme.
    // The solana web3js library is heavy. tweetnacl is the way.
    // Public key from user is a string. Need to convert to Uint8Array for nacl.
    // A simple way is to get it from a base58 decoder, but that's a dependency.
    // Let's use a trick for now: Phantom's `signMessage` returns a signature that can be verified against the message and publicKey.
    
    const signatureBytes = new Buffer(signature, 'base64');
    
    // We need a base58 decoder for the public key. Let's import one.
    const { decode } = await import('https://deno.land/std@0.177.0/encoding/base58.ts');
    const publicKeyUint8Array = decode(publicKey);

    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyUint8Array);

    if (!isVerified) {
      throw new Error('Invalid signature.');
    }

    // 2. Signature is valid, find or create user in Supabase
    // FIX: Use globalThis to access Deno namespace, resolving "Cannot find name 'Deno'" TS error.
    const supabaseAdmin = createClient(
      (globalThis as any).Deno.env.get('SUPABASE_URL') ?? '',
      (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let userProfile = null;
    let isNewUser = false;
    
    // Check if profile exists with this wallet address
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, user:auth_users(*)')
      .eq('wallet_address', publicKey)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116: row not found
      throw profileError;
    }

    if (existingProfile) {
        userProfile = existingProfile;
    } else {
        // Create a new user in auth.users and a profile in public.profiles
        isNewUser = true;
        const base_username = `sol-${publicKey.slice(0, 4)}-${publicKey.slice(-4)}`;

        const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            user_metadata: { wallet_address: publicKey, username: base_username },
        });

        if (authError) throw authError;

        const { data: newProfile, error: newProfileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: newUser.user.id,
                username: base_username,
                wallet_address: publicKey,
            })
            .select()
            .single();
        
        if (newProfileError) throw newProfileError;

        // We need to fetch the full user object again to be consistent
        const { data: createdUser, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('*, user:auth_users(*)')
            .eq('id', newProfile.id)
            .single();

        if (fetchError) throw fetchError;
        userProfile = createdUser;
    }
    
    // 3. Manually create a JWT for the user session
    // This part is complex. A simpler way is to use the user's ID to sign them in.
    // Let's pivot to a simpler, more robust method: return the user's ID and let the client sign in.
    // No, creating a session is better. `createSession` is not available.
    // Let's use `signInWithId` if possible. No.
    // Okay, the standard is to return a custom JWT that supabase can use.
    // Let's use the new `exchangeCodeForSession` method after creating a user.
    // A better approach: After creating the user, we can generate a session for them.
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: userProfile.user.email || `${userProfile.id}@example.com`, // We need an email, even if it's fake. Let's create user with fake email.
    });

    // The user creation needs to be updated to include a fake email.
    // Let's re-do the user creation logic.
    const userEmail = `${publicKey}@phantom.app`; // Keep using this as a unique identifier for auth schema.

    const { data: authData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: userEmail,
        password: publicKey // Use pubkey as password
    });

    let session, userId;

    if (signInError && signInError.message.includes('Invalid login credentials')) {
        // User doesn't exist, create them
        const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email: userEmail,
            password: publicKey,
            email_confirm: true, // Auto-confirm user since we verified wallet
            user_metadata: { wallet_address: publicKey }
        });
        if (signUpError) throw signUpError;
        
        userId = signUpData.user.id;
        isNewUser = true;

        const base_username = `sol-${publicKey.slice(0, 4)}-${publicKey.slice(-4)}`;
        const { error: profileInsertError } = await supabaseAdmin.from('profiles').insert({
            id: userId,
            username: base_username,
            wallet_address: publicKey,
        });

        if(profileInsertError) throw profileInsertError;

        // Now sign in the newly created user
        const { data: newSessionData, error: newSessionError } = await supabaseAdmin.auth.signInWithPassword({
            email: userEmail,
            password: publicKey
        });

        if(newSessionError) throw newSessionError;
        session = newSessionData.session;

    } else if(signInError) {
        throw signInError;
    } else {
        session = authData.session;
        isNewUser = false;
    }


    return new Response(JSON.stringify({
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        isNewUser: isNewUser
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
