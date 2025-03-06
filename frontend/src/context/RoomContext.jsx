"use client"

import { createContext, useState, useContext } from "react"
import { toast } from "react-hot-toast"
import { v4 as uuidv4 } from "uuid"
import { useAuth } from "./AuthContext"
import { createRoom, getRoomById, uploadFileToRoom, deleteFileFromRoom, updateRoomSettings } from "../services/api"

const RoomContext = createContext()

export const useRoom = () => useContext(RoomContext)

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null)
  const [loading, setLoading] = useState(false)
  const { currentUser } = useAuth()

  const createNewRoom = async (isPermanent, settings) => {
    try {
      setLoading(true)

      // Check if user can create permanent room
      if (isPermanent && (!currentUser || currentUser.hasPermanentRoom)) {
        toast.error(
          isPermanent && !currentUser
            ? "You must be logged in to create a permanent room"
            : "You can only create one permanent room",
        )
        return null
      }

      const roomData = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        expiresAt: isPermanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdBy: currentUser ? currentUser.uid : "anonymous",
        isPermanent,
        files: [],
        ...settings,
      }

      const newRoom = await createRoom(roomData)
      setCurrentRoom(newRoom)
      toast.success(`Room created successfully!`)
      return newRoom
    } catch (error) {
      toast.error("Failed to create room")
      console.error(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const fetchRoom = async (roomId) => {
    try {
      setLoading(true)
      const room = await getRoomById(roomId)

      if (!room) {
        toast.error("Room not found or has expired")
        return null
      }

      setCurrentRoom(room)
      return room
    } catch (error) {
      toast.error("Failed to fetch room")
      console.error(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const uploadFile = async (roomId, file) => {
    try {
      setLoading(true)
      const result = await uploadFileToRoom(roomId, file)

      // Update current room with new file
      setCurrentRoom((prev) => ({
        ...prev,
        files: [...prev.files, result.file],
      }))

      toast.success("File uploaded successfully!")
      return result
    } catch (error) {
      toast.error("Failed to upload file")
      console.error(error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (roomId, fileId) => {
    try {
      setLoading(true)
      await deleteFileFromRoom(roomId, fileId)

      // Update current room by removing the file
      setCurrentRoom((prev) => ({
        ...prev,
        files: prev.files.filter((file) => file.id !== fileId),
      }))

      toast.success("File deleted successfully!")
      return true
    } catch (error) {
      toast.error("Failed to delete file")
      console.error(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (roomId, newSettings) => {
    try {
      setLoading(true)
      await updateRoomSettings(roomId, newSettings)

      // Update current room settings
      setCurrentRoom((prev) => ({
        ...prev,
        ...newSettings,
      }))

      toast.success("Room settings updated!")
      return true
    } catch (error) {
      toast.error("Failed to update room settings")
      console.error(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const generateShareLink = (roomId, fileIds = []) => {
    const baseUrl = window.location.origin

    if (fileIds.length > 0) {
      // Generate link for specific files
      const fileParams = fileIds.join(",")
      return `${baseUrl}/room/${roomId}?files=${fileParams}`
    }

    // Generate link for entire room
    return `${baseUrl}/room/${roomId}`
  }

  const value = {
    currentRoom,
    loading,
    createNewRoom,
    fetchRoom,
    uploadFile,
    deleteFile,
    updateSettings,
    generateShareLink,
  }

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

