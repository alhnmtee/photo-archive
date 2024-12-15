// src/services/auth.ts
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  //getAuth 
} from 'firebase/auth';
import { auth } from '../config/firebase';

export const emailSignIn = async (email: string, password: string) => {
  try {
    console.log('Attempting email sign in...', { email });
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful:', result);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-in detailed error:', {
      error,
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    const errorMessage = handleAuthError(error.code);
    throw new Error(errorMessage);
  }
};

export const googleSignIn = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // OAuth scopes ekleyelim
    provider.addScope('profile');
    provider.addScope('email');
    
    // Özel parametreler
    provider.setCustomParameters({
      prompt: 'select_account',
      login_hint: 'user@example.com'
    });

    const result = await signInWithPopup(auth, provider);
   
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    const errorMessage = handleAuthError(error.code);
    throw new Error(errorMessage);
  }
};

// Hata mesajlarını Türkçeleştirme
const handleAuthError = (errorCode: string) => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Hatalı şifre';
    case 'auth/invalid-email':
      return 'Geçersiz email formatı';
    case 'auth/popup-closed-by-user':
      return 'Giriş penceresi kullanıcı tarafından kapatıldı';
    case 'auth/unauthorized-domain':
      return 'Bu domain için yetkilendirme yapılmamış';
    case 'auth/operation-not-allowed':
      return 'Bu giriş yöntemi aktif değil';
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin.';
  }
};

  export const appleSignIn = async () => {
    try {
      const provider = new OAuthProvider('apple.com');
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      throw error;
    }
  };

  export const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };