"use client"

import { createContext, useState, useEffect, useContext } from "react"
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "../services/firebase"
import { toast } from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setCurrentUser({
            ...user,
            ...userDoc.data(),
          })
        } else {
          setCurrentUser(user)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [auth])

  const register = async (email, password, username) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Create user profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username,
        email,
        createdAt: new Date().toISOString(),
        hasPermanentRoom: false,
      })

      toast.success("Account created successfully!")
      return user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      toast.success("Logged in successfully!")
      return user
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      toast.success("Logged out successfully!")
    } catch (error) {
      toast.error(error.message)
      throw error
    }
  }

  const value = {
    currentUser,
    register,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

