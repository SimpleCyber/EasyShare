"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getUserRooms } from "../services/api"

const Dashboard = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const userRooms = await getUserRooms(currentUser.uid)
        setRooms(userRooms)
      } catch (error) {
        console.error("Error fetching rooms:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const handleCreateRoom = () => {
    navigate("/")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Welcome, {currentUser.username || currentUser.email}</p>
          </div>

          <div className="mt-4 md:mt-0">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Rooms</h2>
          <button
            onClick={handleCreateRoom}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Room
          </button>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You don't have any rooms yet.</p>
            <button
              onClick={handleCreateRoom}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{room.name}</h3>
                    <p className="text-sm text-gray-500">
                      {room.isPermanent
                        ? "Permanent Room"
                        : `Expires: ${new Date(room.expiresAt).toLocaleDateString()}`}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {room.files.length} {room.files.length === 1 ? "file" : "files"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      room.isPermanent ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {room.isPermanent ? "Permanent" : "Temporary"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

