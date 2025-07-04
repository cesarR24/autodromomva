import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCustomToken, signInAnonymously, Auth, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { initializeFirebase } from '../firebase.config';
import { getFirestore, setDoc, doc, getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth;
  private db: any;
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isAuthEnabled = true;
  private isAdminSubject = new BehaviorSubject<boolean>(false);
  public isAdmin$: Observable<boolean> = this.isAdminSubject.asObservable();

  constructor() {
    // Inicializar Firebase usando la configuración centralizada
    initializeFirebase();
    this.auth = getAuth();
    this.db = getFirestore();
    
    // Intentar configurar el listener de auth state
    try {
      onAuthStateChanged(this.auth, (user) => {
        // Emitir null solo cuando Firebase determine que no hay usuario
        this.currentUserSubject.next(user ?? null);
      });
    } catch (error) {
      console.warn('Firebase Auth no está disponible, usando modo de desarrollo:', error);
      this.isAuthEnabled = false;
      // Crear un usuario simulado para desarrollo
      this.currentUserSubject.next({
        uid: 'dev-user-id',
        email: 'dev@example.com',
        displayName: 'Usuario de Desarrollo'
      } as User);
    }

    this.currentUser$.subscribe(user => {
      if (user && user.uid) {
        this.checkAdmin(user.uid);
      } else {
        this.isAdminSubject.next(false);
      }
    });
  }

  async register(email: string, password: string) {
    if (!this.isAuthEnabled) {
      return Promise.resolve({ user: this.currentUserSubject.value });
    }
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    // Crear perfil en driverProfiles con role: 'user'
    await setDoc(doc(this.db, 'driverProfiles', cred.user.uid), {
      id: cred.user.uid,
      email: cred.user.email,
      name: cred.user.displayName || '',
      role: 'user',
      createdAt: new Date().toISOString()
    });
    return cred;
  }

  async login(email: string, password: string) {
    if (!this.isAuthEnabled) {
      return Promise.resolve({ user: this.currentUserSubject.value });
    }
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    if (!this.isAuthEnabled) {
      this.currentUserSubject.next(null);
      return Promise.resolve();
    }
    return signOut(this.auth);
  }

  async signInWithCustomToken(token: string) {
    if (!this.isAuthEnabled) {
      return Promise.resolve({ user: this.currentUserSubject.value });
    }
    return signInWithCustomToken(this.auth, token);
  }

  async signInAnonymously() {
    if (!this.isAuthEnabled) {
      return Promise.resolve({ user: this.currentUserSubject.value });
    }
    return signInAnonymously(this.auth);
  }

  getUserId(): string | null {
    return this.currentUserSubject.value?.uid || null;
  }

  async isAdmin(userId: string): Promise<boolean> {
    const docRef = doc(this.db, 'driverProfiles', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() && docSnap.data()['role'] === 'admin';
  }

  private async checkAdmin(userId: string) {
    const isAdmin = await this.isAdmin(userId);
    this.isAdminSubject.next(isAdmin);
  }

  async updateProfileName(uid: string, name: string, team?: string) {
    if (!this.isAuthEnabled) {
      return Promise.resolve();
    }
    // Actualizar displayName en Auth
    const user = this.auth.currentUser;
    if (user && user.uid === uid) {
      await updateProfile(user, { displayName: name });
    }
    // Actualizar nombre y equipo en driverProfiles
    const profileRef = doc(this.db, 'driverProfiles', uid);
    const updateData: any = { name };
    if (team !== undefined) updateData.team = team;
    await setDoc(profileRef, updateData, { merge: true });
  }

  async getCurrentUserProfile(): Promise<any> {
    const user = this.auth.currentUser;
    if (!user) return null;
    const profileRef = doc(this.db, 'driverProfiles', user.uid);
    const docSnap = await getDoc(profileRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }
}
