
import { supabase } from './supabaseClient';
import { Buffer } from 'buffer';

// Add Phantom's injected provider type to the window object
declare global {
  interface Window {
    solana?: any;
    phantom?: {
      solana: any;
    }
  }
}

/**
 * Connects to the user's Phantom wallet.
 * @returns {Promise<string>} The user's public key.
 */
export const connectPhantomWallet = async (): Promise<string> => {
  const provider = window.phantom?.solana;
  
  if (!provider || !provider.isPhantom) {
    window.open('https://phantom.app/', '_blank');
    throw new Error("Phantom wallet not found! Please install it.");
  }

  if (!provider.isConnected) {
    await provider.connect();
  }
  
  return provider.publicKey.toString();
};

/**
 * Signs in a user using a cryptographic signature from their Phantom wallet.
 * This is the standard "Sign-In with Wallet" (SIWE) flow.
 */
export const signInWithPhantom = async (): Promise<void> => {
    if (!supabase) {
        throw new Error("Database connection is not configured.");
    }

    const provider = window.phantom?.solana;
    if (!provider) {
        throw new Error("Phantom provider not available.");
    }
    
    const publicKey = await connectPhantomWallet();

    // 1. Create a message for the user to sign
    const message = `Please sign this message to authenticate with Polymarket.\n\nNonce: ${new Date().toISOString()}`;
    const encodedMessage = new TextEncoder().encode(message);

    // 2. Get the signature from the user
    const { signature } = await provider.signMessage(encodedMessage, "utf8");
    const signatureBuffer = Buffer.from(signature);

    // 3. Call our secure edge function to verify the signature
    const { data, error } = await supabase.functions.invoke('connect-wallet', {
      body: { 
        publicKey: publicKey,
        signature: signatureBuffer.toString('base64'), // Send signature as base64
        message: message,
      },
    });

    if (error) {
        console.error("Edge function error:", error);
        throw new Error(error.message || 'Failed to verify signature.');
    }

    if (!data.accessToken) {
        throw new Error('Authentication failed: No access token returned.');
    }

    // 4. Set the session on the client using the token from our function
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.accessToken,
      refresh_token: data.refreshToken, // Supabase now often returns this
    });

    if (sessionError) {
        throw new Error(`Failed to set session: ${sessionError.message}`);
    }

    // Check if it's a new user based on function response
    if (data.isNewUser) {
        localStorage.setItem('isNewUser', 'true');
    }
};