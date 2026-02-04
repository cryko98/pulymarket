
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
 * Connects to the user's Phantom wallet, handling existing connections gracefully.
 * @returns {Promise<string>} The user's public key as a string.
 * @throws {Error} If Phantom wallet is not found or connection is rejected.
 */
export const connectPhantomWallet = async (): Promise<string> => {
  const provider = window.phantom?.solana;
  
  if (!provider || !provider.isPhantom) {
    window.open('https://phantom.app/', '_blank');
    throw new Error("Phantom wallet not found! Please install it.");
  }

  if (provider.isConnected && provider.publicKey) {
    return provider.publicKey.toString();
  }

  try {
    const response = await provider.connect();
    return response.publicKey.toString();
  } catch (err) {
    throw new Error("Wallet connection rejected by user.");
  }
};


/**
 * Signs in or signs up a user using their Phantom wallet.
 * This function attempts to sign in with credentials derived from the wallet's public key.
 * If the user doesn't exist, it automatically creates a new account.
 * 
 * @throws {Error} If any step of the process fails.
 */
export const signInWithPhantom = async (): Promise<void> => {
    if (!supabase) {
        throw new Error("Database connection is not configured. Please contact the site administrator.");
    }

    const publicKey = await connectPhantomWallet();
    if (!publicKey) throw new Error("Could not get public key from wallet.");

    const email = `${publicKey}@phantom.app`;
    const password = publicKey;

    // 1. Try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        // 2. If sign-in fails, check for specific errors.
        if (signInError.message.includes('Invalid login credentials')) {
            // User does not exist, so sign them up.
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                if (signUpError.message.includes('Email logins are disabled')) {
                     throw new Error("CRITICAL CONFIG ERROR: The Email Provider must be ENABLED in your Supabase project (Authentication -> Providers) for wallet login to function. Please enable it and try again.");
                }
                throw new Error(`Sign-up failed: ${signUpError.message}`);
            }
            // Sign-up was successful, set a flag for the UI to know this is a new user
            localStorage.setItem('isNewUser', 'true');
        } else if (signInError.message.includes('Email logins are disabled')) {
            throw new Error("CRITICAL CONFIG ERROR: The Email Provider must be ENABLED in your Supabase project (Authentication -> Providers) for wallet login to function. Please enable it and try again.");
        } else {
            // A different sign-in error occurred.
            throw new Error(`Sign-in failed: ${signInError.message}`);
        }
    }
    // Sign-in or sign-up was successful
};