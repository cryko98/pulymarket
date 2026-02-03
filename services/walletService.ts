
import { supabase } from './supabaseClient';

// Add Phantom's injected provider type to the window object
declare global {
  interface Window {
    solana?: any;
  }
}

/**
 * Connects to the user's Phantom wallet.
 * @returns {Promise<string>} The user's public key as a string.
 * @throws {Error} If Phantom wallet is not found or connection is rejected.
 */
export const connectPhantomWallet = async (): Promise<string> => {
  const provider = window.solana;
  if (!provider || !provider.isPhantom) {
    throw new Error("Phantom wallet not found! Please install it from phantom.app");
  }

  await provider.connect({ onlyIfTrusted: false });
  if (!provider.publicKey) {
     throw new Error("Wallet connection rejected by user.");
  }

  return provider.publicKey.toString();
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
            // Sign-up was successful (and user is logged in if email confirmation is off)
        } else {
            // A different sign-in error occurred
            throw new Error(`Sign-in failed: ${signInError.message}`);
        }
    }
    // Sign-in was successful
};
