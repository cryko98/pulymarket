
import { supabase } from './supabaseClient';

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
    try {
        await provider.connect();
    } catch (err) {
        throw new Error("Wallet connection rejected by user.");
    }
  }
  
  return provider.publicKey.toString();
};

/**
 * Signs in or signs up a user using their Phantom wallet public key.
 * This function uses a deterministic email/password combo derived from the public key.
 * It first tries to sign in. If that fails because the user doesn't exist, it signs them up.
 */
export const signInWithPhantom = async (): Promise<void> => {
    if (!supabase) {
        throw new Error("Database connection is not configured.");
    }

    const publicKey = await connectPhantomWallet();
    if (!publicKey) {
        throw new Error("Could not get public key from wallet.");
    }

    const email = `${publicKey}@phantom.app`;
    const password = publicKey;

    // 1. Attempt to sign in the user
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        // 2. If sign-in fails, check if it's because the user doesn't exist
        if (signInError.message.includes('Invalid login credentials')) {
            // User does not exist, so let's sign them up
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                // Handle potential sign-up errors, like if email logins are disabled
                 if (signUpError.message.includes('Signups not allowed')) {
                     throw new Error("CRITICAL CONFIG ERROR: The 'Email' Provider must be ENABLED in your Supabase project (Authentication -> Providers) for wallet login to function.");
                }
                throw new Error(`Sign-up failed: ${signUpError.message}`);
            }
            // Sign-up was successful, this automatically logs the user in
            localStorage.setItem('isNewUser', 'true');

        } else if (signInError.message.includes('Email logins are disabled')) {
             throw new Error("CRITICAL CONFIG ERROR: The 'Email' Provider must be ENABLED in your Supabase project (Authentication -> Providers) for wallet login to function.");
        } else {
            // A different, unexpected sign-in error occurred
            throw new Error(`Sign-in failed: ${signInError.message}`);
        }
    }
    // If we are here, either the initial sign-in was successful, or the sign-up was.
};
