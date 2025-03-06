import axios from "axios"
import { db } from "./firebase"
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  getDocs,
} from "firebase/firestore"

const API_URL = "http://localhost:5000/api"

// Room operations
export const createRoom = async (roomData) => {
  try {
    // Save room to Firestore
    await setDoc(doc(db, "rooms", roomData.id), roomData)

    // If it's a permanent room, update user's hasPermanentRoom status
    if (roomData.isPermanent && roomData.createdBy !== "anonymous") {
      await updateDoc(doc(db, "users", roomData.createdBy), {
        hasPermanentRoom: true,
        permanentRoomId: roomData.id,
      })
    }

    return roomData
  } catch (error) {
    console.error("Error creating room:", error)
    throw error
  }
}

export const getRoomById = async (roomId) => {
  try {
    const roomDoc = await getDoc(doc(db, "rooms", roomId))

    if (!roomDoc.exists()) {
      return null
    }

    const roomData = roomDoc.data()

    // Check if temporary room has expired
    if (!roomData.isPermanent && roomData.expiresAt) {
      const expiryDate = new Date(roomData.expiresAt)
      if (expiryDate < new Date()) {
        return null // Room has expired
      }
    }

    return { id: roomDoc.id, ...roomData }
  } catch (error) {
    console.error("Error fetching room:", error)
    throw error
  }
}

export const getUserRooms = async (userId) => {
  try {
    const roomsQuery = query(collection(db, "rooms"), where("createdBy", "==", userId))

    const roomsSnapshot = await getDocs(roomsQuery)
    const rooms = []

    roomsSnapshot.forEach((doc) => {
      const roomData = doc.data()

      // Filter out expired temporary rooms
      if (!roomData.isPermanent && roomData.expiresAt) {
        const expiryDate = new Date(roomData.expiresAt)
        if (expiryDate < new Date()) {
          return // Skip expired rooms
        }
      }

      rooms.push({ id: doc.id, ...roomData })
    })

    return rooms
  } catch (error) {
    console.error("Error fetching user rooms:", error)
    throw error
  }
}

export const updateRoomSettings = async (roomId, settings) => {
  try {
    await updateDoc(doc(db, "rooms", roomId), settings)
    return true
  } catch (error) {
    console.error("Error updating room settings:", error)
    throw error
  }
}

// File operations
export const uploadFileToRoom = async (roomId, file) => {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("roomId", roomId)

    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    // Update room document with new file
    const fileData = response.data
    await updateDoc(doc(db, "rooms", roomId), {
      files: arrayUnion(fileData),
    })

    return { success: true, file: fileData }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export const deleteFileFromRoom = async (roomId, fileId) => {
  try {
    // First get the file data to have the public_id for Cloudinary deletion
    const roomDoc = await getDoc(doc(db, "rooms", roomId))
    const roomData = roomDoc.data()
    const fileToDelete = roomData.files.find((file) => file.id === fileId)

    if (!fileToDelete) {
      throw new Error("File not found")
    }

    // Delete from Cloudinary
    await axios.delete(`${API_URL}/files/${fileToDelete.public_id}`)

    // Remove file from room document
    await updateDoc(doc(db, "rooms", roomId), {
      files: arrayRemove(fileToDelete),
    })

    return true
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

