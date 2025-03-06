"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useRoom } from "../context/RoomContext"
import { useAuth } from "../context/AuthContext"
import CreateRoomForm from "../components/rooms/CreateRoomForm"

const Home = () => {
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const { createNewRoom } = useRoom()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const handleCreateRoom = async (roomData) => {
    const { isPermanent, ...settings } = roomData
    const newRoom = await createNewRoom(isPermanent, settings)

    if (newRoom) {
      navigate(`/room/${newRoom.id}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Share Files Easily</h1>
        <p className="text-xl text-gray-600">
          Create a room, upload files, and share them with anyone. Rooms expire after 24 hours unless you create a
          permanent room.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {isCreatingRoom ? (
          <CreateRoomForm
            onSubmit={handleCreateRoom}
            onCancel={() => setIsCreatingRoom(false)}
            canCreatePermanent={currentUser && !currentUser.hasPermanentRoom}
          />
        ) : (
          <div className="text-center">
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
            >
              Create a New Room
            </button>
            <p className="mt-4 text-gray-600">
              {!currentUser ? (
                <span>
                  <a href="/login" className="text-blue-600 hover:underline">
                    Log in
                  </a>{" "}
                  to create permanent rooms
                </span>
              ) : currentUser.hasPermanentRoom ? (
                <span>You already have a permanent room in your dashboard</span>
              ) : (
                <span>You can create one permanent room</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          title="Temporary Rooms"
          description="Create rooms that automatically expire after 24 hours. Perfect for quick file sharing."
          icon="⏱️"
        />
        <FeatureCard
          title="Permanent Rooms"
          description="Create one permanent room when logged in. Your files stay available as long as you need."
          icon="🔒"
        />
        <FeatureCard
          title="Flexible Sharing"
          description="Share entire rooms or just specific files. Control who can edit your files."
          icon="🔗"
        />
      </div>
    </div>
  )
}

const FeatureCard = ({ title, description, icon }) => (
  <div className="bg-white rounded-lg shadow-md p-6 text-center">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
)

export default Home

