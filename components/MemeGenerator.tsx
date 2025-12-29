
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Upload, Shuffle, Download, Image as ImageIcon, Info, Loader2 } from 'lucide-react';

const MemeGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const POLYMARKET_LOGO_URL = "https://img.cryptorank.io/coins/polymarket1671006384460.png";

  const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const str = reader.result as string;
            setCustomImage(str);
            resolve(str.split(',')[1]);
        };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) fileToBase64(file);
  };

  const handleRandomMeme = async () => {
    const scenarios = [
        "driving a green lamborghini on the moon",
        "meditating surrounded by green candlesticks",
        "looking at a computer screen showing +1000% gains",
        "eating a banana while sitting on a pile of gold coins",
        "fighting a red bear in a boxing ring",
        "wearing deal with it sunglasses"
    ];
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const randomPrompt = `A crypto analyst ${randomScenario}, minimalist clean drawing style, meme art.`;
    setPrompt(randomPrompt);
    await generateMeme(randomPrompt);
  };

  const generateMeme = async (textPrompt: string) => {
    if (!textPrompt) return;
    setIsLoading(true);
    setGeneratedImage(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let imagePart = null;
        let finalPrompt = textPrompt;

        if (customImage) {
             const base64Data = customImage.split(',')[1];
             imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
             finalPrompt = `Edit this image. ${textPrompt}. Keep the main subject but change the context.`;
        } else {
            const base64Data = await urlToBase64(POLYMARKET_LOGO_URL);
            imagePart = { inlineData: { mimeType: 'image/jpeg', data: base64Data } };
            finalPrompt = `Generate a new image. ${textPrompt}. Maintain a consistent style with the reference logo.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [imagePart, { text: finalPrompt }] },
        });

        const responseParts = response.candidates?.[0]?.content?.parts;
        if (responseParts) {
            for (const part of responseParts) {
                if (part.inlineData) {
                    setGeneratedImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                    break;
                }
            }
        }
    } catch (error) {
        console.error("Generation failed:", error);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-xl flex justify-center items-center gap-3">
                        <span className="bg-white text-black px-2 rounded-lg transform -rotate-3">MEME</span>
                        <span className="text-outline uppercase italic">TERMINAL</span>
                    </h2>
                    <p className="text-xl text-white/90 font-medium">$Polymarket Visionary Lab.</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
                    <div className="flex flex-col gap-6 mb-8">
                        <div className="bg-black/40 rounded-xl p-4 border border-white/10">
                            <div className="flex items-start gap-3 mb-2">
                                <Info className="text-blue-400 mt-1 shrink-0" size={18} />
                                <p className="text-sm text-white/80 leading-relaxed">
                                    <span className="text-blue-400 font-bold uppercase">Pro Tip:</span> Upload a reference image to maintain consistency in your market memes.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your vision (e.g., Bear market survivor holding $Polymarket)..."
                                className="flex-1 h-14 px-4 bg-white text-black font-bold rounded-xl focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && generateMeme(prompt)}
                            />
                            <div className="flex gap-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                <button onClick={() => fileInputRef.current?.click()} className={`h-14 px-4 rounded-xl border-2 transition-all ${customImage ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white/20 border-white/20 text-white'}`}>
                                    {customImage ? <ImageIcon size={24} /> : <Upload size={24} />}
                                </button>
                                <button onClick={handleRandomMeme} className="h-14 px-4 bg-purple-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                                    <Shuffle size={24} />
                                </button>
                                <button onClick={() => generateMeme(prompt)} disabled={isLoading || !prompt} className="h-14 px-8 bg-black text-white font-bold rounded-xl border-2 border-white/20 shadow-xl flex items-center gap-2">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    GENERATE
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="min-h-[300px] md:min-h-[400px] bg-black/50 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group">
                        {isLoading && (
                            <div className="flex flex-col items-center gap-4 z-10">
                                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                                <p className="text-blue-400 font-mono animate-pulse uppercase">Consulting Oracle...</p>
                            </div>
                        )}
                        {!isLoading && !generatedImage && (
                            <div className="text-center p-6 opacity-40">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-white" />
                                <p className="text-white text-lg font-bold">Terminal Idle.</p>
                            </div>
                        )}
                        {generatedImage && (
                            <>
                                <img src={generatedImage} alt="Meme" className="w-full h-full object-contain max-h-[600px] z-10" />
                                <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={generatedImage} download={`polymarket-meme-${Date.now()}.png`} className="bg-white text-black font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2">
                                        <Download size={18} /> Download
                                    </a>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default MemeGenerator;
