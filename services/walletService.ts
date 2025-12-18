import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';

// --- KONFIGURÁCIÓ ---
// IDE ÍRD BE A SAJÁT WALLET CÍMEDET, ahová a fogadások érkeznek!
// Most a dev (fejlesztői) hálózaton vagyunk a teszteléshez, de átírhatod 'mainnet-beta'-ra.
// Beállítva a CA címre, mint "Kincstár"
const TREASURY_WALLET = "9ftnbzpAP4SUkmHMoFuX4ofvDXCHxbrTXKiSFL4Wpump"; 
const NETWORK = 'mainnet-beta'; // Éles hálózat

export const connectWallet = async (): Promise<{ publicKey: string } | null> => {
  try {
    const { solana } = window as any;
    if (solana && solana.isPhantom) {
      const response = await solana.connect();
      return { publicKey: response.publicKey.toString() };
    } else {
      alert('Solana object not found! Get a Phantom Wallet 👻');
      window.open('https://phantom.app/', '_blank');
      return null;
    }
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const disconnectWallet = async () => {
  const { solana } = window as any;
  if (solana) {
    await solana.disconnect();
  }
};

export const checkIfWalletConnected = async (): Promise<string | null> => {
  try {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      // Csak akkor csatlakozunk automatikusan, ha már engedélyezte a user (onlyIfTrusted)
      // Megjegyzés: A Phantom API változhat, ez a standard flow.
      if (solana.isConnected) {
          return solana.publicKey.toString();
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const sendBetTransaction = async (amountSOL: number, marketId: string, prediction: 'YES' | 'NO') => {
    const { solana } = window as any;
    if (!solana || !solana.isPhantom) throw new Error("Wallet not connected");

    const senderPublicKey = new PublicKey(solana.publicKey.toString());
    const connection = new Connection(clusterApiUrl(NETWORK), 'confirmed');
    
    // A fogadó tárca (kincstár) - Jelen esetben a CA
    const recipientPublicKey = new PublicKey(TREASURY_WALLET);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderPublicKey,
        toPubkey: recipientPublicKey,
        lamports: amountSOL * LAMPORTS_PER_SOL,
      })
    );

    // Memo hozzáadása, hogy tudjuk mire fogadott (opcionális, de hasznos on-chain követéshez)
    // Megjegyzés: A @solana/web3.js verziótól függően a MemoProgram más lehet, 
    // de egyszerűség kedvéért most csak a tranzakciót küldjük. 
    // A backend (Supabase) majd a kliens jelzése alapján rögzíti, de validálni a blockchainen kellene.

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;

    try {
      const { signature } = await solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);
      return signature;
    } catch (err) {
      console.error("Transaction failed", err);
      throw err;
    }
};