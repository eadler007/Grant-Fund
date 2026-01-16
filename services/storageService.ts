
import { ProjectAnalysis } from '../types';
import { initializeApp, getApp, getApps, deleteApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore as getFirestoreLite, 
  doc, 
  setDoc, 
  getDoc,
  Firestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-lite.js";

// Ensure these credentials exactly match your new Firebase Project settings
const firebaseConfig = {
  apiKey: "AIzaSyDlg9lqkbjTlu86Ob5bSQiKntRKZ5--LWo",
  authDomain: "grant-funding-database.firebaseapp.com",
  projectId: "grant-funding-database",
  storageBucket: "grant-funding-database.firebasestorage.app",
  messagingSenderId: "50863810122",
  appId: "1:50863810122:web:9f5b4ea7d77d6d4621a8b3",
  measurementId: "G-QCHYCD8DT0"
};

let db: Firestore | null = null;
let connectionError: string | null = null;
let isPermissionDenied = false;
let isSuccessfullyConnected = false;

const initFirebase = () => {
  try {
    // If apps exist but we need to refresh (e.g. after credential change), we handle that here
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestoreLite(app);
    console.log("NFC Storage: Connected to", firebaseConfig.projectId);
  } catch (e: any) {
    connectionError = e.message;
    console.error("Firebase Initialization Failure:", e);
  }
};

initFirebase();

export const getFirebaseStatus = () => ({
    isConnected: !!db && isSuccessfullyConnected,
    error: connectionError,
    isPermissionDenied
});

export const resetPermissionFlag = () => {
    isPermissionDenied = false;
    isSuccessfullyConnected = false;
};

export const checkCloudHealth = async (): Promise<boolean> => {
    if (!db) return false;
    try {
        // Try to read a standard location
        const probeRef = doc(db, "system", "health");
        await getDoc(probeRef);
        
        isSuccessfullyConnected = true;
        isPermissionDenied = false;
        return true;
    } catch (error: any) {
        const errMsg = error.message?.toLowerCase() || "";
        if (error.code === 'permission-denied' || errMsg.includes('permission') || errMsg.includes('403')) {
            isPermissionDenied = true;
            isSuccessfullyConnected = false;
            return false;
        }
        // If not found, we are actually 'connected' to the instance, just no data exists yet
        isSuccessfullyConnected = true;
        return true;
    }
};

const cleanData = (obj: any): any => {
  return JSON.parse(JSON.stringify(obj, (key, value) => 
    value === undefined ? null : value
  ));
};

export const saveProjectToCloud = async (project: ProjectAnalysis): Promise<boolean> => {
  if (!db || !project.id) return false;
  
  try {
    const docRef = doc(db, "projects", project.id);
    const dataToSave = cleanData(project);
    dataToSave.lastUpdated = Date.now();
    
    await setDoc(docRef, dataToSave);
    isPermissionDenied = false;
    isSuccessfullyConnected = true;
    return true;
  } catch (error: any) {
    console.error("Cloud Save Error:", error);
    if (error.code === 'permission-denied') isPermissionDenied = true;
    return false;
  }
};

export const loadProjectFromCloud = async (id: string): Promise<ProjectAnalysis | null> => {
  if (!db || !id) return null;

  try {
    const docRef = doc(db, "projects", id);
    const docSnap = await getDoc(docRef);
    
    isPermissionDenied = false;
    isSuccessfullyConnected = true;
    if (docSnap.exists()) {
      return docSnap.data() as ProjectAnalysis;
    }
  } catch (error: any) {
    console.error("Cloud Load Error:", error);
    if (error.code === 'permission-denied') isPermissionDenied = true;
  }
  return null;
};
