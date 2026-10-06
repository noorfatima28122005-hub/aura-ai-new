import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  limit,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WorkspaceData, Client, Project, Task, Invoice, UserProfile } from '../types';

// Active configuration supporting optional VITE_FIREBASE_* environment variables with fallback to firebase-applet-config.json
const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};

export const activeFirebaseConfig = {
  projectId: env?.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId || 'gen-lang-client-0655069095',
  appId: env?.VITE_FIREBASE_APP_ID || firebaseConfig.appId || '1:429833408376:web:000a910bd3b8d2ea6e028d',
  apiKey: env?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey || 'AIzaSyDZZDOu0nkIGoVbBD6Vamf6s24W1e-VGnM',
  authDomain: env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain || 'gen-lang-client-0655069095.firebaseapp.com',
  firestoreDatabaseId: env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || 'ai-studio-auraai-fbba9aaa-6efa-4616-8282-cba9b9b13e7b',
  storageBucket: env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket || 'gen-lang-client-0655069095.firebasestorage.app',
  messagingSenderId: env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId || '429833408376',
  measurementId: env?.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId || '',
};

// Initialize Firebase App instance safely (singleton)
export const app = !getApps().length ? initializeApp(activeFirebaseConfig) : getApp();

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore with dedicated firestoreDatabaseId
export const db = activeFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, activeFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export { onAuthStateChanged };
export type { FirebaseUser };

/**
 * Maps technical Firebase Auth error codes into human-understandable messages
 * without hiding the specific error or showing generic fallbacks.
 */
export function formatFirebaseAuthError(error: any): {
  code: string;
  message: string;
  userMessage: string;
} {
  const code = error?.code || 'auth/unknown';
  const rawMessage = error?.message || 'Authentication operation failed.';

  let userMessage = 'Authentication failed. Please try again.';

  switch (code) {
    case 'auth/popup-closed-by-user':
      userMessage = 'Sign-in popup was closed before completing authentication. Please try again.';
      break;
    case 'auth/popup-blocked':
      userMessage =
        'Google Sign-In popup was blocked by your browser. Please allow popups for aura-ai-by-noor-green.vercel.app and try again.';
      break;
    case 'auth/cancelled-popup-request':
      userMessage =
        'Another authentication popup was already open. Please complete sign-in in the open window or try again.';
      break;
    case 'auth/unauthorized-domain':
      userMessage =
        'This website domain (aura-ai-by-noor-green.vercel.app) is not authorized for Google Sign-In. Please add it to Firebase Console > Authentication > Settings > Authorized domains.';
      break;
    case 'auth/operation-not-allowed':
      userMessage =
        'Google authentication is not enabled for this Firebase project. Please enable Google provider in Firebase Console > Authentication > Sign-in method.';
      break;
    case 'auth/network-request-failed':
      userMessage =
        'Google Sign-In is currently unavailable because of a network connection problem. Please check your internet connection.';
      break;
    case 'auth/invalid-api-key':
      userMessage =
        'Firebase configuration is incomplete or the API key is invalid (auth/invalid-api-key).';
      break;
    case 'auth/app-not-authorized':
      userMessage =
        'This web application is not authorized to use Firebase Authentication with the current credentials.';
      break;
    case 'auth/user-disabled':
      userMessage =
        'This account has been disabled. Please contact your workspace administrator.';
      break;
    case 'auth/user-not-found':
      userMessage =
        'No user account was found with these credentials. Please check your email or create an account.';
      break;
    case 'auth/invalid-credential':
      userMessage =
        'The authentication credentials provided are invalid or expired. Please sign in again.';
      break;
    case 'auth/too-many-requests':
      userMessage =
        'Too many sign-in attempts have occurred. Please wait a moment before trying again.';
      break;
    default:
      if (rawMessage && !rawMessage.includes('[object Object]')) {
        userMessage = rawMessage;
      }
      break;
  }

  return { code, message: rawMessage, userMessage };
}

/**
 * Sign in using Firebase Google Auth popup with comprehensive try/catch diagnostics
 */
export async function signInWithGoogleFirebase(): Promise<{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  idToken: string;
  user: FirebaseUser;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const idToken = await user.getIdToken();

    return {
      uid: user.uid,
      email: user.email || 'workingbynoor@gmail.com',
      displayName: user.displayName || user.email?.split('@')[0] || 'Noor A.',
      photoURL:
        user.photoURL ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      idToken,
      user,
    };
  } catch (error: any) {
    const { code, message, userMessage } = formatFirebaseAuthError(error);

    console.error(
      `[Firebase Google Sign-In Error] Code: "${code}" | Message: "${message}"`,
      error
    );

    if (code === 'auth/unauthorized-domain') {
      const currentHost =
        typeof window !== 'undefined' ? window.location.hostname : 'aura-ai-by-noor-green.vercel.app';
      console.error(
        `[Firebase Auth UNAUTHORIZED DOMAIN]: Domain "${currentHost}" is not in the Firebase Authorized Domains list!\n` +
          `Exact steps to resolve in Firebase Console:\n` +
          `1. Open Firebase Console: https://console.firebase.google.com\n` +
          `2. Select project: gen-lang-client-0655069095\n` +
          `3. In left navigation, click "Authentication" (under Build)\n` +
          `4. Click the "Settings" tab at the top\n` +
          `5. Under "Authorized domains", click "Add domain"\n` +
          `6. Enter: aura-ai-by-noor-green.vercel.app\n` +
          `7. Click "Save"`
      );
    }

    throw {
      code,
      message,
      userMessage,
      originalError: error,
    };
  }
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.warn('[Firebase SignOut Warning]:', err?.message || err);
  }
}

/**
 * Validate connection to Firestore on boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firebase Firestore Offline Note]: Network currently offline or unreachable.');
    }
    return false;
  }
}

/**
 * Save prospective client project intake inquiry to Firestore
 */
export async function saveClientInquiryToFirestore(inquiry: {
  name: string;
  email: string;
  company?: string;
  projectType: string;
  description: string;
  goal?: string;
  budget?: string;
  timeline?: string;
  preferredContact?: string;
  additionalNotes?: string;
  createdAt: string;
  status: 'New' | 'Reviewing' | 'Contacted' | 'Closed';
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const inquiryId = `inq_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const inquiryRef = doc(db, 'client_inquiries', inquiryId);
    await setDoc(inquiryRef, {
      ...inquiry,
      id: inquiryId,
      submittedAt: serverTimestamp(),
    });
    return { success: true, id: inquiryId };
  } catch (err: any) {
    console.warn('[Firestore Client Inquiry Warning]:', err?.message || err);
    return { success: false, error: err?.message || 'Failed to save to Firestore' };
  }
}

/**
 * Save user profile and full workspace data to Firestore
 */
export async function saveWorkspaceToFirestore(
  userId: string,
  data: WorkspaceData,
  profile?: UserProfile
): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        uid: userId,
        email: profile?.email || 'workingbynoor@gmail.com',
        displayName: profile?.name || 'Workspace Owner',
        companyName: profile?.companyName || 'Apex Strategic Studio',
        role: profile?.role || 'Founder & Principal Consultant',
        stats: data.stats || null,
        updatedAt: new Date().toISOString(),
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Save active clients batch/documents
    if (data.clients && data.clients.length > 0) {
      for (const client of data.clients) {
        if (client.id) {
          const clientRef = doc(db, 'users', userId, 'clients', client.id);
          await setDoc(clientRef, { ...client, userId, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
    }

    // Save active projects
    if (data.projects && data.projects.length > 0) {
      for (const project of data.projects) {
        if (project.id) {
          const projectRef = doc(db, 'users', userId, 'projects', project.id);
          await setDoc(projectRef, { ...project, userId, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
    }

    // Save active tasks
    if (data.tasks && data.tasks.length > 0) {
      for (const task of data.tasks) {
        if (task.id) {
          const taskRef = doc(db, 'users', userId, 'tasks', task.id);
          await setDoc(taskRef, { ...task, userId, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
    }

    // Save invoices
    if (data.invoices && data.invoices.length > 0) {
      for (const inv of data.invoices) {
        if (inv.id) {
          const invRef = doc(db, 'users', userId, 'invoices', inv.id);
          await setDoc(invRef, { ...inv, userId, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
    }

    return true;
  } catch (err) {
    console.warn('Firestore persistence warning:', err);
    return false;
  }
}

/**
 * Load workspace records from Firestore
 */
export async function loadWorkspaceFromFirestore(
  userId: string
): Promise<Partial<WorkspaceData> | null> {
  if (!userId) return null;
  try {
    const clientsRef = collection(db, 'users', userId, 'clients');
    const projectsRef = collection(db, 'users', userId, 'projects');
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const invoicesRef = collection(db, 'users', userId, 'invoices');

    const [clientsSnap, projectsSnap, tasksSnap, invoicesSnap] = await Promise.all([
      getDocs(clientsRef).catch(() => null),
      getDocs(projectsRef).catch(() => null),
      getDocs(tasksRef).catch(() => null),
      getDocs(invoicesRef).catch(() => null),
    ]);

    const clients: Client[] = [];
    if (clientsSnap) {
      clientsSnap.forEach((d) => clients.push(d.data() as Client));
    }

    const projects: Project[] = [];
    if (projectsSnap) {
      projectsSnap.forEach((d) => projects.push(d.data() as Project));
    }

    const tasks: Task[] = [];
    if (tasksSnap) {
      tasksSnap.forEach((d) => tasks.push(d.data() as Task));
    }

    const invoices: Invoice[] = [];
    if (invoicesSnap) {
      invoicesSnap.forEach((d) => invoices.push(d.data() as Invoice));
    }

    return {
      clients: clients.length > 0 ? clients : undefined,
      projects: projects.length > 0 ? projects : undefined,
      tasks: tasks.length > 0 ? tasks : undefined,
      invoices: invoices.length > 0 ? invoices : undefined,
    };
  } catch (err) {
    console.warn('Failed to load from Firestore:', err);
    return null;
  }
}

/**
 * Save chat message to Firestore chat collection
 */
export async function saveChatMessageToFirestore(
  userId: string,
  message: {
    id: string;
    role: 'user' | 'model';
    content: string;
    model?: string;
    timestamp?: string;
    groundingSources?: any[];
  }
): Promise<boolean> {
  if (!userId) return false;
  try {
    const chatDocRef = doc(db, 'users', userId, 'chats', message.id);
    await setDoc(chatDocRef, {
      ...message,
      userId,
      createdAt: serverTimestamp(),
      isoTime: message.timestamp || new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.warn('Could not save chat message to Firestore:', err);
    return false;
  }
}

/**
 * Load recent chat messages from Firestore
 */
export async function loadChatMessagesFromFirestore(userId: string): Promise<any[]> {
  if (!userId) return [];
  try {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, limit(50));
    const snap = await getDocs(q);
    const messages: any[] = [];
    snap.forEach((d) => messages.push(d.data()));
    return messages.sort((a, b) => (a.isoTime || '').localeCompare(b.isoTime || ''));
  } catch (err) {
    console.warn('Could not load chat messages from Firestore:', err);
    return [];
  }
}

/**
 * Persist user voice speed and volume preferences to Firestore
 */
export async function saveVoicePreferencesToFirestore(
  userId: string,
  prefs: { speed: number; volume: number; isMuted: boolean; language?: string }
): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        voicePreferences: {
          speed: prefs.speed,
          volume: prefs.volume,
          isMuted: prefs.isMuted,
          language: prefs.language || 'en-US',
          updatedAt: new Date().toISOString(),
        },
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.warn('Could not save voice preferences to Firestore:', err);
    return false;
  }
}

/**
 * Retrieve user voice speed and volume preferences from Firestore
 */
export async function loadVoicePreferencesFromFirestore(
  userId: string
): Promise<{ speed?: number; volume?: number; isMuted?: boolean; language?: string } | null> {
  if (!userId) return null;
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data()?.voicePreferences || null;
    }
    return null;
  } catch (err) {
    console.warn('Could not load voice preferences from Firestore:', err);
    return null;
  }
}

