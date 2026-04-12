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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-600/10 via-transparent to-transparent rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center space-y-8"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.5 }}
                    className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-2xl shadow-indigo-500/10"
                >
                    <Logo size={56} />
                </motion.div>

                {/* Title */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
                        Manimatic
                    </h1>
                    <p className="text-slate-400 text-lg max-w-sm">
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
                <p className="text-xs text-slate-600 mt-8">
                    Sign in to save your work and access it from anywhere
                </p>
            </motion.div>
        </div>
    );
}

export default AuthPage;
