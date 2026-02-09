import Link from "next/link";
import {
    BookOpen,
    Search,
    Zap,
    Chrome,
    Smartphone,
    ExternalLink,
    ChevronRight,
    Database
} from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-ivory text-charcoal flex flex-col selection:bg-wine/20">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-ivory/80 backdrop-blur-md border-b border-parchment px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <BookOpen className="text-wine transition-transform hover:rotate-12 duration-300" size={24} />
                    <span className="text-xl font-serif font-bold text-wine tracking-tighter">
                        RecipeVault
                    </span>
                </div>
                <div className="flex items-center space-x-8">
                    <Link href="/recipes" className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase hover:text-wine transition-colors">
                        Enter Archive
                    </Link>
                    <Link
                        href="/sign-in"
                        className="bg-wine text-ivory px-4 py-2 rounded-sm text-[10px] font-sans font-bold tracking-[2px] uppercase shadow-sm hover:bg-wine/90 transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Sign In
                    </Link>
                </div>
            </nav>

            <main className="flex-1 pt-32 pb-24">
                {/* Hero Section */}
                <section className="px-6 max-w-5xl mx-auto text-center mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="inline-block px-3 py-1 bg-wine/5 border border-wine/20 rounded-full mb-6">
                        <span className="text-[9px] font-sans font-bold tracking-[3px] text-wine uppercase">
                            The Digital Culinary Archive
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif font-black text-charcoal leading-tight mb-8">
                        Curate your culinary <br className="hidden md:block" />
                        <span className="italic text-wine">legacy</span>.
                    </h1>
                    <p className="text-lg md:text-xl font-sans text-charcoal-muted max-w-2xl mx-auto mb-10 leading-relaxed italic border-l-2 border-parchment pl-6">
                        "We preserve the art of cooking by transforming fleeting digital discoveries into structured, permanent archive records."
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link
                            href="/recipes"
                            className="w-full sm:w-auto bg-wine text-ivory px-8 py-4 rounded-sm text-xs font-sans font-bold tracking-[3px] uppercase shadow-md hover:bg-wine/90 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
                        >
                            <span>Explore The Vault</span>
                            <ChevronRight size={16} />
                        </Link>
                        <Link
                            href="/sign-up"
                            className="w-full sm:w-auto px-8 py-4 border border-parchment rounded-sm text-xs font-sans font-bold tracking-[3px] uppercase text-charcoal hover:bg-parchment/30 transition-all flex items-center justify-center"
                        >
                            Begin Archiving
                        </Link>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="px-6 max-w-6xl mx-auto mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="p-8 bg-parchment/10 border border-parchment hover:border-wine/30 transition-colors group">
                            <div className="w-12 h-12 bg-wine/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Chrome size={24} className="text-wine" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-charcoal mb-4 lowercase italic">
                                01. Capture
                            </h3>
                            <p className="text-sm font-sans text-charcoal-muted leading-6 lowercase">
                                use our web extension to snap recipes from any culinary source—food blogs, blogs, or youtube videos.
                            </p>
                        </div>

                        <div className="p-8 bg-parchment/10 border border-parchment hover:border-wine/30 transition-colors group">
                            <div className="w-12 h-12 bg-wine/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Zap size={24} className="text-wine" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-charcoal mb-4 lowercase italic">
                                02. Transcribe
                            </h3>
                            <p className="text-sm font-sans text-charcoal-muted leading-6 lowercase">
                                our archivist ai effortlessly parses raw content into structured Ingredients, instructions, and creative variations.
                            </p>
                        </div>

                        <div className="p-8 bg-parchment/10 border border-parchment hover:border-wine/30 transition-colors group">
                            <div className="w-12 h-12 bg-wine/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Smartphone size={24} className="text-wine" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-charcoal mb-4 lowercase italic">
                                03. Synchronize
                            </h3>
                            <p className="text-sm font-sans text-charcoal-muted leading-6 lowercase">
                                access your entire collection from your mobile device while you cook. offline access ensures the archive is always available.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Philosophy Section */}
                <section className="bg-charcoal text-ivory py-24 px-6 overflow-hidden relative">
                    <div className="max-w-4xl mx-auto relative z-10 text-center">
                        <Database className="text-wine opacity-40 mx-auto mb-8 animate-pulse" size={48} />
                        <h2 className="text-3xl md:text-5xl font-serif mb-10 leading-snug">
                            Why it <span className="italic font-bold">Resonates</span>.
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                            <div>
                                <h4 className="text-[10px] font-sans font-bold tracking-[3px] text-wine/80 uppercase mb-4">
                                    Permanence
                                </h4>
                                <p className="text-sm font-sans text-ivory/70 leading-relaxed font-light lowercase">
                                    The web is ephemeral; links break and content disappears. RecipeVault creates a permanent, static record of your favorite discoveries that belongs to you forever.
                                </p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-sans font-bold tracking-[3px] text-wine/80 uppercase mb-4">
                                    Clarity
                                </h4>
                                <p className="text-sm font-sans text-ivory/70 leading-relaxed font-light lowercase">
                                    Cut through the digital noise. No ads, no scrolling through life stories—just the pure culinary essence, meticulously transcribed for the modern archivist.
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-wine/5 blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-wine/5 blur-[150px]" />
                </section>
            </main>

            <footer className="px-6 py-12 border-t border-parchment flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
                <div className="flex items-center space-x-2 opacity-60 grayscale hover:grayscale-0 transition-all cursor-default">
                    <BookOpen size={18} className="text-wine" />
                    <span className="text-sm font-serif font-bold text-charcoal">
                        RecipeVault
                    </span>
                </div>
                <div className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase">
                    © 2026 DIGITAL CULINARY ARCHIVE | ALL RECORDS PRESERVED
                </div>
                <div className="flex space-x-6">
                    <Link href="/privacy" className="text-[9px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase hover:text-wine transition-colors">
                        Privacy
                    </Link>
                    <Link href="/terms" className="text-[9px] font-sans font-bold tracking-[1px] text-charcoal-muted uppercase hover:text-wine transition-colors">
                        Terms
                    </Link>
                </div>
            </footer>
        </div>
    );
}
