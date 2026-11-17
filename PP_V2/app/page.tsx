"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { Trophy, Zap, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const words = ['Compite, aprende y gana'];
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
  	const fullText = words[0];

  	const timeout = setTimeout(() => {
    	if (!deleting) {
      	setText(fullText.substring(0, text.length + 1));

      	if (text.length === fullText.length) {
       	 setDeleting(true);
      	}
    	} else {
      	setText(fullText.substring(0, text.length - 1));

      	if (text.length === 0) {
        setDeleting(false);
      	}
    	}
  	}, deleting ? 100 : 150);

  	return () => clearTimeout(timeout);
	}, [text, deleting]);
	
  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/games');
    }
  }, [user, loading, router]);
	
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="w-4 h-4" /> Quiz para todos
          </div>
		<h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight">
 		 {text.replace(' gana', '')}
		  {text.includes(' gana') && (
	    <span className="text-primary"> gana</span>
	  )}
	  <span className="text-primary animate-pulse">|</span>
		</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Participa en el quiz competitivo, compartiendo con tus compañeros de las diferentes areas
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={() => router.push('/register')}
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              Crear cuenta LDAP
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-8 py-3 rounded-lg border border-border hover:bg-accent transition-all"
            >
              Ya tengo cuenta LDAP
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-6 mt-20"
        >
          {[
            //{ icon: Shield, title: 'Titulo', desc: 'Sistema de' },
          ].map((feat: any, i: number) => (
            <div key={i} className="p-6 rounded-xl bg-card shadow-md hover:shadow-lg transition-all space-y-3">
              <feat.icon className="w-8 h-8 text-primary" />
              <h3 className="font-display font-semibold text-lg">{feat?.title}</h3>
              <p className="text-muted-foreground text-sm">{feat?.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
	{/* Footer */}
      <footer className="w-full border-t border-border/50 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          @:{' '}
          <span className="font-medium text-[#1174e6]">
            Ericsson  
          </span>
        </p>
      </footer>
    </div>
  );
}
