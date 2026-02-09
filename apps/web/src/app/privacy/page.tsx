import Link from "next/link";
import { BookOpen, ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-ivory text-charcoal font-sans selection:bg-wine/20">
            <nav className="border-b border-parchment px-6 py-4 flex justify-between items-center bg-ivory/80 backdrop-blur-md sticky top-0 z-50">
                <Link href="/" className="flex items-center space-x-2 group">
                    <BookOpen className="text-wine transition-transform group-hover:rotate-12" size={20} />
                    <span className="text-lg font-serif font-bold text-wine tracking-tighter">RecipeVault</span>
                </Link>
                <Link href="/" className="text-[10px] font-bold tracking-[2px] uppercase text-charcoal-muted hover:text-wine flex items-center">
                    <ArrowLeft size={12} className="mr-1" /> Return Home
                </Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
                <div className="mb-12">
                    <ShieldCheck className="text-wine mb-6" size={48} />
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-charcoal mb-4">Privacy Policy</h1>
                    <p className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase">
                        LAST UPDATED: FEBRUARY 10, 2026
                    </p>
                </div>

                <section className="prose prose-sm prose-stone max-w-none">
                    <div className="space-y-12">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-wine italic border-b border-parchment pb-2 mb-4">01. Our Philosophy</h2>
                            <p className="text-charcoal-muted leading-relaxed lowercase">
                                at recipevault, we believe your culinary discoveries are your personal legacy. our privacy approach is simple: we capture only what you ask us to archive, and we never sell your data to third parties. we are a tool for preservation, not a data broker.
                            </p>
                        </div>

                        <div>
                            <h2 className="text-xl font-serif font-bold text-wine italic border-b border-parchment pb-2 mb-4">02. Information We Collect</h2>
                            <ul className="space-y-4 list-none p-0">
                                <li className="flex items-start">
                                    <span className="text-wine mr-2 font-bold">•</span>
                                    <p className="text-charcoal-muted flex-1 lowercase">
                                        <strong className="text-charcoal uppercase text-[10px] block mb-1">Account Data:</strong>
                                        your email and authentication credentials, managed securely via Clerk, to ensure only you can access your vault.
                                    </p>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-wine mr-2 font-bold">•</span>
                                    <p className="text-charcoal-muted flex-1 lowercase">
                                        <strong className="text-charcoal uppercase text-[10px] block mb-1">Archive Content:</strong>
                                        the recipe text, URLs, and metadata you explicitly choose to save using our extension or mobile app.
                                    </p>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-wine mr-2 font-bold">•</span>
                                    <p className="text-charcoal-muted flex-1 lowercase">
                                        <strong className="text-charcoal uppercase text-[10px] block mb-1">Usage Data:</strong>
                                        minimal diagnostic technical information (like IP address) logged temporarily for security and system stability.
                                    </p>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-serif font-bold text-wine italic border-b border-parchment pb-2 mb-4">03. Use of Information</h2>
                            <p className="text-charcoal-muted leading-relaxed lowercase">
                                We use your information exclusively to provide the RecipeVault service, including:
                            </p>
                            <ul className="mt-4 space-y-2 list-none p-0 lowercase text-charcoal-muted">
                                <li>• transcribing raw text into structured recipes.</li>
                                <li>• synchronizing your archive across your devices.</li>
                                <li>• maintaining the security of your account.</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-serif font-bold text-wine italic border-b border-parchment pb-2 mb-4">04. Extension Specifics</h2>
                            <p className="text-charcoal-muted leading-relaxed lowercase">
                                The RecipeVault Chrome extension only activates its content analysis capabilities when you interact with the extension to save a recipe. It does not track your browsing history or record background activity beyond the open tab you are currently archiving.
                            </p>
                        </div>

                        <div className="bg-parchment/30 p-8 border border-parchment italic">
                            <p className="text-sm font-sans text-charcoal-muted leading-relaxed lowercase">
                                "your archive is a private treasury. we treat your digital records with the same respect as a hand-written family heirloom."
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="px-6 py-12 border-t border-parchment text-center">
                <p className="text-[10px] font-sans font-bold tracking-[2px] text-charcoal-muted uppercase">
                    RecipeVault | Digital Culinary Archive | Privacy Compliance
                </p>
            </footer>
        </div>
    );
}
