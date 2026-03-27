"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	ReactNode,
} from "react";
import {
	signInAnonymously,
	signInWithPopup,
	signOut,
	onAuthStateChanged,
	User,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import { getBanRecord } from "./ban-service";

function isExpectedPopupCancellation(error: unknown) {
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String((error as { code?: string }).code)
			: "";

	return (
		code === "auth/cancelled-popup-request" ||
		code === "auth/popup-closed-by-user"
	);
}

interface FirebaseContextType {
	user: User | null;
	loading: boolean;
	isAdmin: boolean;
	signInWithGoogle: () => Promise<void>;
	signOutUser: () => Promise<void>;
	signInAnonymously: () => Promise<void>;
	isAnonymous: boolean;
	banMessage: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
	user: null,
	loading: true,
	isAdmin: false,
	signInWithGoogle: async () => {},
	signOutUser: async () => {},
	signInAnonymously: async () => {},
	isAnonymous: false,
	banMessage: null,
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [banMessage, setBanMessage] = useState<string | null>(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			if (currentUser) {
				const banRecord = await getBanRecord(currentUser.uid);
				if (banRecord) {
					setBanMessage(banRecord.reason);
					await signOut(auth);
					setUser(null);
					setIsAdmin(false);
					setIsAnonymous(false);
					setLoading(false);
					return;
				}

				setUser(currentUser);
				setIsAnonymous(currentUser.isAnonymous);
				setBanMessage(null);
				// Check if user is admin
				const adminUids = process.env.NEXT_PUBLIC_ADMIN_UIDS?.split(",") || [];
				setIsAdmin(adminUids.includes(currentUser.uid));
			} else {
				// No user is currently logged in
				setUser(null);
				setIsAdmin(false);
				setIsAnonymous(false);
			}
			setLoading(false);
		});

		return unsubscribe;
	}, []);

	const handleSignInWithGoogle = async () => {
		try {
			await signInWithPopup(auth, googleProvider);
		} catch (error) {
			if (!isExpectedPopupCancellation(error)) {
				console.error("Google sign-in error:", error);
			}
			throw error;
		}
	};

	const handleSignOut = async () => {
		try {
			await signOut(auth);

			setUser(null);
			setIsAdmin(false);
			setIsAnonymous(false);
		} catch (error) {
			console.error("Sign out error:", error);
			throw error;
		}
	};

	const handleSignInAnonymously = async () => {
		try {
			await signInAnonymously(auth);
		} catch (error) {
			console.error("Anonymous sign-in failed:", error);
			throw error;
		}
	};

	return (
		<FirebaseContext.Provider
			value={{
				user,
				loading,
				isAdmin,
				signInWithGoogle: handleSignInWithGoogle,
				signOutUser: handleSignOut,
				signInAnonymously: handleSignInAnonymously,
				isAnonymous,
				banMessage,
			}}
		>
			{children}
		</FirebaseContext.Provider>
	);
}

export function useFirebase() {
	const context = useContext(FirebaseContext);
	if (!context) {
		throw new Error("useFirebase must be used within FirebaseProvider");
	}
	return context;
}
