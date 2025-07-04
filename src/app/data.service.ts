import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth/auth';
import { getFirestore, collection, doc, addDoc, setDoc, getDoc, onSnapshot, query, connectFirestoreEmulator, getDocs, deleteDoc, where } from 'firebase/firestore';
import { initializeFirebase } from './firebase.config';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Participant {
  id: string;
  name: string;
}

interface Match {
  id: string;
  playerA: Participant | null;
  playerB: Participant | null;
  winner: Participant | null;
  round: number;
}

interface Bracket {
  name: string;
  description: string;
  matches: Match[];
  tournamentId: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private db;

  constructor(private authService: AuthService) {
    // Inicializar Firebase usando la configuración centralizada
    initializeFirebase();
    this.db = getFirestore();
  }

  getRaceResults(): Observable<any[]> {
    return new Observable(observer => {
      try {
        const colRef = collection(this.db, 'raceResults');
        const q = query(colRef);
        const unsubscribe = onSnapshot(q, snapshot => {
          const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(results);
        }, err => {
          console.error('Error en getRaceResults:', err);
          observer.error(err);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error al configurar getRaceResults:', error);
        observer.error(error);
        return () => {}; // Función de limpieza vacía
      }
    });
  }

  async addRaceResult(data: any): Promise<any> {
    try {
      const colRef = collection(this.db, 'raceResults');
      const result = await addDoc(colRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return result;
    } catch (error: any) {
      console.error('Error al agregar race result:', error);
      throw new Error(`Error al guardar el resultado: ${error.message || 'Error desconocido'}`);
    }
  }

  async getDriverProfile(driverId: string): Promise<any> {
    try {
      const docRef = doc(this.db, 'driverProfiles', driverId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error al obtener driver profile:', error);
      throw error;
    }
  }

  async setDriverProfile(driverId: string, data: any): Promise<void> {
    try {
      const docRef = doc(this.db, 'driverProfiles', driverId);
      await setDoc(docRef, {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('Error al guardar driver profile:', error);
      throw error;
    }
  }

  getOverallPoints(): Observable<any[]> {
    return new Observable(observer => {
      try {
        const colRef = collection(this.db, 'overallPoints');
        const q = query(colRef);
        const unsubscribe = onSnapshot(q, snapshot => {
          const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(results);
        }, err => {
          console.error('Error en getOverallPoints:', err);
          observer.error(err);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error al configurar getOverallPoints:', error);
        observer.error(error);
        return () => {}; // Función de limpieza vacía
      }
    });
  }

  getTournaments(): Observable<any[]> {
    return new Observable(observer => {
      try {
        const colRef = collection(this.db, 'tournaments');
        const q = query(colRef);
        const unsubscribe = onSnapshot(q, snapshot => {
          const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(tournaments);
        }, err => {
          console.error('Error en getTournaments:', err);
          observer.error(err);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error al configurar getTournaments:', error);
        observer.error(error);
        return () => {}; // Función de limpieza vacía
      }
    });
  }

  getTournamentBrackets(tournamentId: string): Observable<any[]> {
    return new Observable(observer => {
      try {
        const colRef = collection(this.db, 'brackets');
        const q = query(colRef, where('tournamentId', '==', tournamentId));
        const unsubscribe = onSnapshot(q, snapshot => {
          const brackets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(brackets);
        }, err => {
          console.error('Error en getTournamentBrackets:', err);
          observer.error(err);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error al configurar getTournamentBrackets:', error);
        observer.error(error);
        return () => {}; // Función de limpieza vacía
      }
    });
  }

  async createBracket(participants: Participant[], name: string, description: string, tournamentId: string): Promise<any> {
    // Ordenar aleatoriamente (puedes cambiar el criterio)
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches: Match[] = [];
    let round = 1;
    let matchId = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({
        id: `match-${matchId++}`,
        playerA: shuffled[i],
        playerB: shuffled[i + 1] || null,
        winner: null,
        round,
      });
    }
    const bracket: Bracket = {
      name,
      description,
      matches,
      tournamentId
    } as any;
    // Guardar en Firestore
    const colRef = collection(this.db, 'brackets');
    return addDoc(colRef, bracket);
  }

  // Obtener todos los perfiles de pilotos
  async getAllDriverProfiles(): Promise<any[]> {
    const colRef = collection(this.db, 'driverProfiles');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener todos los brackets
  async getAllBrackets(): Promise<any[]> {
    const colRef = collection(this.db, 'brackets');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Obtener todos los brackets como Observable (para tiempo real)
  getAllBracketsObservable(): Observable<any[]> {
    return new Observable(observer => {
      try {
        const colRef = collection(this.db, 'brackets');
        const q = query(colRef);
        const unsubscribe = onSnapshot(q, snapshot => {
          const brackets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          observer.next(brackets);
        }, err => {
          console.error('Error en getAllBracketsObservable:', err);
          observer.error(err);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error al configurar getAllBracketsObservable:', error);
        observer.error(error);
        return () => {}; // Función de limpieza vacía
      }
    });
  }

  // Eliminar un bracket
  async deleteBracket(bracketId: string): Promise<void> {
    const docRef = doc(this.db, 'brackets', bracketId);
    await deleteDoc(docRef);
  }

  // Actualizar un bracket (nombre, descripción y participantes)
  async updateBracket(bracketId: string, name: string, description: string, participants: Participant[]): Promise<void> {
    // Re-generar matches
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches: Match[] = [];
    let round = 1;
    let matchId = 1;
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({
        id: `match-${matchId++}`,
        playerA: shuffled[i],
        playerB: shuffled[i + 1] || null,
        winner: null,
        round,
      });
    }
    const docRef = doc(this.db, 'brackets', bracketId);
    await setDoc(docRef, { name, description, matches }, { merge: true });
  }

  async createTournament(name: string, description: string): Promise<any> {
    const colRef = collection(this.db, 'tournaments');
    const docRef = await addDoc(colRef, {
      name,
      description,
      createdAt: new Date().toISOString()
    });
    return docRef;
  }

  async updateMatchResult(bracketId: string, matchId: string, score1: number, score2: number, winnerId: string, timerStart?: number) {
    const docRef = doc(this.db, 'brackets', bracketId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error('Bracket no encontrado');
    const bracket = docSnap.data();
    let matches = bracket['matches'];
    // Actualiza el match actual con el ganador o el temporizador
    matches = matches.map((m: any) => {
      if (m.id === matchId) {
        const updated: any = {
          ...m,
          score1,
          score2,
          winner: m.playerA?.id === winnerId ? m.playerA : m.playerB?.id === winnerId ? m.playerB : null
        };
        if (timerStart) {
          updated.timerStartedAt = timerStart;
          updated.timerDuration = 300;
        }
        return updated;
      }
      return m;
    });
    // Encuentra el match actual y su ronda
    const currentMatch = matches.find((m: any) => m.id === matchId);
    if (currentMatch && currentMatch.winner) {
      const currentRound = currentMatch.round || 1;
      const nextRound = currentRound + 1;
      // Verifica si ya existen matches en la siguiente ronda
      const nextRoundMatches = matches.filter((m: any) => m.round === nextRound);
      // Si NO existen matches en la siguiente ronda y TODOS los matches de la ronda actual tienen ganador, crea la siguiente ronda
      const currentRoundMatches = matches.filter((m: any) => m.round === currentRound);
      const allWinners = currentRoundMatches.every((m: any) => m.winner);
      if (allWinners && nextRoundMatches.length === 0) {
        // Empareja ganadores para la siguiente ronda
        const winners = currentRoundMatches.map((m: any) => m.winner);
        if (winners.length === 1) {
          // Solo hay un ganador, es el campeón/finalista, no crear más rondas
          // Opcional: puedes guardar el campeón en el bracket si lo deseas
          await setDoc(docRef, { matches, champion: winners[0] }, { merge: true });
          return;
        }
        let matchIdBase = matches.length + 1;
        for (let i = 0; i < winners.length; i += 2) {
          matches.push({
            id: `match-${matchIdBase++}`,
            playerA: winners[i],
            playerB: winners[i + 1] || null,
            winner: null,
            round: nextRound
          });
        }
      } else if (nextRoundMatches.length > 0) {
        // Si ya existen matches en la siguiente ronda, avanza el ganador al primer slot vacío
        let nextMatch = matches.find((m: any) => m.round === nextRound && (!m.playerA || !m.playerB));
        if (nextMatch) {
          if (!nextMatch.playerA) {
            nextMatch.playerA = currentMatch.winner;
          } else if (!nextMatch.playerB) {
            nextMatch.playerB = currentMatch.winner;
          }
          matches = matches.map((m: any) => m.id === nextMatch.id ? nextMatch : m);
        }
      }
    }
    await setDoc(docRef, { matches }, { merge: true });
  }

  async updateDriverProfile(uid: string, data: { name?: string; team?: string }) {
    const docRef = doc(this.db, 'driverProfiles', uid);
    await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true });
  }

  async getCurrentUserProfile(uid: string): Promise<any> {
    const docRef = doc(this.db, 'driverProfiles', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async uploadTeamLogo(uid: string, file: File): Promise<string> {
    try {
      const storage = getStorage();
      const filePath = `team-logos/${uid}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      // Actualizar el perfil del usuario con la nueva URL
      await this.setDriverProfile(uid, { teamLogoUrl: url });
      return url;
    } catch (error) {
      console.error('Error al subir el logo del equipo:', error);
      throw error;
    }
  }
}
