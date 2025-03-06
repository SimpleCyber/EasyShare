"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { useRoom } from "../context/RoomContext"
import { useAuth } from "../context/AuthContext"
import FileUpload from "../components/files/FileUpload"
import FileList from "../components/files/FileList"
import RoomSettings from "../components/rooms/RoomSettings"
import ShareOptions from "../components/rooms/ShareOptions"

const Room = () => {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const { currentRoom, fetchRoom, loading } = useRoom()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showSettings, setShowSettings] = useState(false)
  const [showShareOptions, setShowShareOptions] = useState(false)

  // Get specific files from URL if present
  const specificFileIds = searchParams.get("files")?.split(",") || []

  useEffect(() => {
    const loadRoom = async () => {
      const room = await fetchRoom(roomId)
      if (!room) {
        navigate("/")
      }
    }

    loadRoom()
  }, [roomId, fetchRoom, navigate])

  if (loading || !currentRoom) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isOwner = currentUser && currentRoom.createdBy === currentUser.uid
  const canEdit = isOwner || currentRoom.isEditable
  const canEditFiles = isOwner || currentRoom.filesEditable

  // Filter files if specific files are requested
  const filesToDisplay =
    specificFileIds.length > 0
      ? currentRoom.files.filter((file) => specificFileIds.includes(file.id))
      : currentRoom.files

  const toggleFileSelection = (fileId) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const getRoomExpiryInfo = () => {
    if (currentRoom.isPermanent) {
      return "Permanent Room"
    }

    const expiryDate = new Date(currentRoom.expiresAt)
    const now = new Date()
    const hoursLeft = Math.round((expiryDate - now) / (1000 * 60 * 60))

    return `Expires in ${hoursLeft} hours`
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{currentRoom.name}</h1>
            <p className="text-gray-600">{getRoomExpiryInfo()}</p>
          </div>

          <div className="flex space-x-3 mt-4 md:mt-0">
            {canEdit && (
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Room Settings
              </button>
            )}

            <button
              onClick={() => setShowShareOptions(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Share
            </button>
          </div>
        </div>

        {canEditFiles && <FileUpload roomId={roomId} />}
      </div>

      <FileList
        files={filesToDisplay}
        roomId={roomId}
        canEdit={canEditFiles}
        selectedFiles={selectedFiles}
        onToggleSelect={toggleFileSelection}
      />

      {showSettings && <RoomSettings room={currentRoom} onClose={() => setShowSettings(false)} />}

      {showShareOptions && (
        <ShareOptions roomId={roomId} selectedFiles={selectedFiles} onClose={() => setShowShareOptions(false)} />
      )}
    </div>
  )
}

export default Room

