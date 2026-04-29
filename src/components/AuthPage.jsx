import React from 'react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const GOOGLE_CLIENT_ID = '1099239564139-tb9e7vmnmlquk2uojsmikrune76lj5n8.apps.googleusercontent.com';

function AuthPage({ onAuthSuccess }) {
    const handleGoogleSignIn = () => {
        /* global google */
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                if (response.credential) {
                    onAuthSuccess(response.credential);
                }
            },
        });
        google.accounts.id.prompt();
    };

    React.useEffect(() => {
        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            /* global google */
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    if (response.credential) {
                        onAuthSuccess(response.credential);
                    }
                },
            });

            // Render the Google button
            google.accounts.id.renderButton(
                document.getElementById('google-signin-btn'),
                {
                    type: 'standard',
                    theme: 'filled_black',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'pill',
                    width: 300,
                }
            );
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup
            const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (existingScript) existingScript.remove();
        };
    }, [onAuthSuccess]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-zinc-500/5 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center space-y-8"
            >
                {/* Video Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="w-full max-w-xs mx-auto overflow-hidden rounded-[2rem] border border-[#333333] shadow-2xl bg-black"
                >
                    <video 
                        src="/manimatic_logo_animation.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        className="w-full h-auto object-cover scale-[1.05]"
                    />
                </motion.div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        Manimatic
                    </h1>
                    <p className="text-[#a1a1aa] text-lg max-w-sm">
                        Create beautiful animations from natural language with AI
                    </p>
                </div>

                {/* Google Sign-In Button */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="mt-4"
                >
                    <div id="google-signin-btn" className="flex justify-center" />
                </motion.div>

                {/* Footer */}
                <p className="text-xs text-[#71717a] mt-8">
                    Sign in to save your work and access it from anywhere
                </p>
            </motion.div>
        </div>
    );
}

export default AuthPage;
