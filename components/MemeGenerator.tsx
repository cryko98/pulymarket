import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Upload, Shuffle, Download, Image as ImageIcon, Info, Loader2 } from 'lucide-react';

const MemeGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the API key logic similar to previous components (env or fallback)
  // WARNING: In a production app, never expose keys on client side.
  const env = (import.meta as any).env || {};
  // Fallback key provided for demo purposes since user environment might not be set up
  const apiKey = env.VITE_API_KEY || "AIzaSyARmYNQRlzWCwWDtPaU1u57Y6iODogdbmI";
  
  const ai = new GoogleGenAI({ apiKey });

  const PREDICTOOR_LOGO_URL = "https://pbs.twimg.com/media/G8TkHNYWoAIWHeT?format=jpg&name=medium";

  // Helper to convert URL to Base64
  const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                // Remove data:image/jpeg;base64, prefix if present for API
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching base image:", error);
        throw error;
    }
  };

  // Helper to convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const str = reader.result as string;
            setCustomImage(str); // Update preview
            resolve(str.split(',')[1]); // Return raw base64
        };
        reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        fileToBase64(file); // Just triggers the preview update logic inside
    }
  };

  const handleRandomMeme = async () => {
    const scenarios = [
        "driving a green lamborghini on the moon",
        "meditating surrounded by green candlesticks",
        "looking at a computer screen showing +1000% gains",
        "eating a banana while sitting on a pile of gold coins",
        "fighting a red bear in a boxing ring",
        "hacking into the matrix code",
        "wearing deal with it sunglasses"
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPrompt = `The Predictoor character ${randomScenario}, minimalist clean drawing style, meme art.`;
    setPrompt(randomPrompt);
    await generateMeme(randomPrompt, true);
  };

  const generateMeme = async (textPrompt: string, isRandom: boolean = false) => {
    if (!textPrompt) return;
    setIsLoading(true);
    setGeneratedImage(null);

    try {
        let imagePart = null;
        let finalPrompt = textPrompt;

        // Logic: Check if we need to use the Predictoor reference
        const usePredictoorRef = textPrompt.toLowerCase().includes('predictoor') || isRandom;
        
        if (customImage) {
             // User uploaded an image, prioritize that
             const base64Data = customImage.split(',')[1];
             imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
             };
             finalPrompt = `Edit this image. ${textPrompt}. Keep the main subject but change the context.`;
        } else if (usePredictoorRef) {
            // Fetch the logo to use as reference
            const base64Data = await urlToBase64(PREDICTOOR_LOGO_URL);
            imagePart = {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            };
            finalPrompt = `Generate a new image based on this character reference. The character should be ${textPrompt.replace(/predictoor/i, 'the character')}. Maintain the character's key features (hat, face) but put them in the new scene.`;
        }

        const parts: any[] = [];
        if (imagePart) {
            parts.push(imagePart);
        }
        parts.push({ text: finalPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Good for general image generation/editing
            contents: { parts },
            // Note: config usually not needed for basic generation unless specific JSON schema, which we don't need for images.
        });

        // Extract image from response
        // The API returns image data in the parts
        const responseParts = response.candidates?.[0]?.content?.parts;
        if (responseParts) {
            for (const part of responseParts) {
                if (part.inlineData) {
                    const imgUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                    setGeneratedImage(imgUrl);
                    break;
                }
            }
        }
        
        if (!generatedImage && response.text) {
             // If no image was generated but text was (error or refusal), we might want to show it, but for now just console.
             console.log("Model returned text instead of image:", response.text);
        }

    } catch (error) {
        console.error("Generation failed:", error);
        alert("Failed to generate meme. Try again or check API quota.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/10 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-xl flex justify-center items-center gap-3">
                        <span className="bg-white text-black px-2 rounded-lg transform -rotate-3">MEME</span>
                        <span style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000' }}>GENERATOR</span>
                    </h2>
                    <p className="text-xl text-white/90 font-medium">Create legendary memes with AI.</p>
                </div>

                {/* Main Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
                    
                    {/* Controls */}
                    <div className="flex flex-col gap-6 mb-8">
                        
                        <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-3 mb-2">
                                <Info className="text-blue-400 mt-1 shrink-0" size={18} />
                                <p className="text-sm text-white/80 leading-relaxed">
                                    <span className="text-blue-400 font-bold">PRO TIP:</span> Type <span className="font-mono bg-white/20 px-1 rounded text-white">predictoor</span> in your prompt to use the official mascot as the character. Or upload your own reference image!
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your meme (e.g., Predictoor holding a golden ticket)..."
                                    className="w-full h-14 pl-4 pr-4 bg-white text-black font-bold rounded-xl border-2 border-transparent focus:border-green-400 focus:outline-none placeholder:text-gray-400 shadow-inner"
                                    onKeyDown={(e) => e.key === 'Enter' && generateMeme(prompt)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`h-14 px-4 rounded-xl border-2 flex items-center justify-center transition-all ${customImage ? 'bg-green-500 border-green-600 text-white' : 'bg-white/20 border-white/20 hover:bg-white/30 text-white'}`}
                                    title="Upload Reference Image"
                                >
                                    {customImage ? <ImageIcon size={24} /> : <Upload size={24} />}
                                </button>
                                
                                <button 
                                    onClick={handleRandomMeme}
                                    className="h-14 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl border-2 border-purple-500 shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
                                    title="Random Scenario"
                                >
                                    <Shuffle size={24} />
                                </button>

                                <button 
                                    onClick={() => generateMeme(prompt)}
                                    disabled={isLoading || !prompt}
                                    className="h-14 px-8 bg-black hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl border-2 border-white/20 shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    GENERATE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Result Area */}
                    <div className="min-h-[300px] md:min-h-[400px] bg-black/50 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group">
                        
                        {isLoading && (
                            <div className="flex flex-col items-center gap-4 z-10">
                                <Loader2 className="w-12 h-12 text-green-400 animate-spin" />
                                <p className="text-green-400 font-mono animate-pulse">Consulting the Oracle...</p>
                            </div>
                        )}

                        {!isLoading && !generatedImage && (
                            <div className="text-center p-6 opacity-40">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-white" />
                                <p className="text-white text-lg font-bold">No meme generated yet.</p>
                                <p className="text-white/70">Enter a prompt or roll the dice!</p>
                            </div>
                        )}

                        {generatedImage && (
                            <>
                                <img 
                                    src={generatedImage} 
                                    alt="Generated Meme" 
                                    className="w-full h-full object-contain max-h-[600px] z-10"
                                />
                                <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a 
                                        href={generatedImage} 
                                        download={`predictoor-meme-${Date.now()}.png`}
                                        className="bg-white text-black font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                                    >
                                        <Download size={18} />
                                        Download
                                    </a>
                                </div>
                            </>
                        )}
                        
                        {/* Custom Image Preview Indicator */}
                        {customImage && !generatedImage && !isLoading && (
                             <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full border border-white/20 flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full overflow-hidden">
                                    <img src={customImage} className="w-full h-full object-cover" />
                                </div>
                                <span className="text-xs text-white">Reference Uploaded</span>
                                <button onClick={() => setCustomImage(null)} className="text-white/50 hover:text-white ml-1">×</button>
                             </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default MemeGenerator;