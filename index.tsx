import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import App from './App';
import i18n from './services/i18n';
import { auth, ADMIN_EMAIL } from './services/firebase';
import AuthGate from './components/AuthGate';
import IntroVideo from './components/IntroVideo';
import { MOCK_USERS } from './utils/mockData';
import { User, UserRole } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

const AppWrapper: React.FC = () => {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null | 'loading'>('loading');
    const [appUser, setAppUser] = useState<User | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
    const [showIntroVideo, setShowIntroVideo] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                let foundUser = allUsers.find(u => u.email === user.email);
                
                if (!foundUser) {
                    foundUser = {
                        email: user.email!,
                        full_name: user.displayName || user.email!.split('@')[0],
                        whatsapp: '',
                        position: 'New User',
                        role_global: user.email === ADMIN_EMAIL ? UserRole.Admin : UserRole.Colaborador,
                        is_active: true,
                        teams: [],
                        projects: [],
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        trashed_at: null,
                        language_preference: 'es',
                    };
                    // Add new user to the list for this session
                    setAllUsers(prev => [foundUser!, ...prev]);
                }
                
                setFirebaseUser(user);
                setAppUser(foundUser);
            } else {
                setFirebaseUser(null);
                setAppUser(null);
            }
        });
        return () => unsubscribe();
    }, [allUsers]);

    // Mostrar vídeo de introducción si está habilitado
    if (showIntroVideo) {
        return <IntroVideo onComplete={() => setShowIntroVideo(false)} />;
    }

    if (firebaseUser === 'loading') {
        return <div className="flex items-center justify-center min-h-screen text-slate-300 bg-[#0B0F1A]">Authenticating...</div>;
    }

    if (!firebaseUser || !appUser) {
        return <AuthGate />;
    }
    
    return (
        <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-300 bg-[#0B0F1A]">Cargando...</div>}>
            <I18nextProvider i18n={i18n}>
                <App currentUser={appUser} initialUsers={allUsers} />
            </I18nextProvider>
        </React.Suspense>
    );
};


root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
