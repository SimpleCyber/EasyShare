"use client"

import { useState, useRef } from "react"
import { useRoom } from "../../context/RoomContext"

const FileUpload = ({ roomId }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState([])
  const fileInputRef = useRef(null)
  const { uploadFile, loading } = useRoom()

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles(droppedFiles)
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files)
    setFiles(selectedFiles)
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    for (const file of files) {
      await uploadFile(roomId, file)
    }

    // Clear files after upload
    setFiles([])
  }

  return (
    <div className="mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop files here, or{" "}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500"
              onClick={() => fileInputRef.current.click()}
            >
              browse
            </button>
          </p>
          <p className="text-xs text-gray-500">Support for images, videos, audio, PDFs, and more</p>
        </div>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
      </div>

      {files.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h3>
          <ul className="text-sm text-gray-600 space-y-1 mb-4">
            {files.map((file, index) => (
              <li key={index} className="flex items-center">
                <span className="truncate">{file.name}</span>
                <span className="ml-2 text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpload}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white ${
              loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {loading ? "Uploading..." : "Upload Files"}
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUpload

