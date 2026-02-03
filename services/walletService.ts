
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
    // For better user experience, open the Phantom website if the wallet is not found.
    window.open('https://phantom.app/', '_blank');
    throw new Error("Phantom wallet not found! Please install it.");
  }

  // KEY FIX: If the wallet is already connected, return the public key directly.
  // This handles cases where the user has previously approved the connection
  // and the popup doesn't need to appear again, fixing the "nothing happens" issue.
  if (provider.isConnected && provider.publicKey) {
    return provider.publicKey.toString();
  }

  try {
    // If not connected, request a connection. This will open the popup.
    const response = await provider.connect();
    return response.publicKey.toString();
  } catch (err) {
    // This block will catch any errors, including when the user rejects the connection request.
    throw new Error("Wallet connection rejected by user.");
  }
};


/**
 * Signs in or signs up a user using their Phantom wallet.
 * This function attempts to sign in with credentials derived from the wallet's public key.
 * If the user doesn't exist, it automatically creates a new account.
 * 
 * IMPORTANT: For this to work, you MUST disable "Confirm email" in your
 * Supabase project's Authentication -> Provider -> Email settings.
 * The email `publicKey@phantom.app` is a unique identifier, not a real inbox.
 * 
 * @throws {Error} If any step of the process fails.
 */
export const signInWithPhantom = async (): Promise<void> => {
    // CRITICAL FIX: Check if Supabase is configured before attempting to use it.
    // This prevents a crash and provides a clear error to the user if env vars are missing.
    if (!supabase) {
        throw new Error("Database connection is not configured. Please contact the site administrator.");
    }

    const publicKey = await connectPhantomWallet();
    if (!publicKey) throw new Error("Could not get public key from wallet.");

    const email = `${publicKey}@phantom.app`;
    const password = publicKey; // Using the public key as a password for this auth method

    // 1. Try to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        // 2. If sign-in fails, assume the user doesn't exist and try to sign up.
        if (signInError.message.includes('Invalid login credentials')) {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) {
                // If sign-up also fails, throw that error
                throw new Error(`Sign-up failed: ${signUpError.message}`);
            }
            // Sign-up was successful, set a flag for the UI to know this is a new user
            localStorage.setItem('isNewUser', 'true');
        } else {
            // A different sign-in error occurred
            throw new Error(`Sign-in failed: ${signInError.message}`);
        }
    }
    // Sign-in was successful
};
