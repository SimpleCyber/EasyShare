"use client"

import { useState } from "react"

const CreateRoomForm = ({ onSubmit, onCancel, canCreatePermanent }) => {
  const [formData, setFormData] = useState({
    name: "",
    isEditable: false,
    filesEditable: false,
    isPermanent: false,
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Create a New Room</h2>

      <div>
        <label className="block text-gray-700 mb-2" htmlFor="name">
          Room Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My Awesome Room"
          required
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isEditable"
            checked={formData.isEditable}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>Allow others to edit this room</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="filesEditable"
            checked={formData.filesEditable}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
          <span>Allow others to edit files in this room</span>
        </label>

        {canCreatePermanent && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isPermanent"
              checked={formData.isPermanent}
              onChange={handleChange}
              className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span>Make this a permanent room</span>
          </label>
        )}
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Room
        </button>
      </div>
    </form>
  )
}

export default CreateRoomForm

