"use client"

import { useState } from "react"
import { useRoom } from "../../context/RoomContext"
import FilePreview from "./FilePreview"

const FileList = ({ files, roomId, canEdit, selectedFiles, onToggleSelect }) => {
  const [previewFile, setPreviewFile] = useState(null)
  const { deleteFile, loading } = useRoom()

  const handleDelete = async (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      await deleteFile(roomId, fileId)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.startsWith("video/")) return "🎬"
    if (fileType.startsWith("audio/")) return "🎵"
    if (fileType === "application/pdf") return "📄"
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return "📊"
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📽️"
    return "📁"
  }

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">No files in this room yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {files.map((file) => (
          <div
            key={file.id}
            className={`border rounded-lg overflow-hidden ${
              selectedFiles.includes(file.id) ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
            }`}
          >
            <div
              className="h-40 bg-gray-100 flex items-center justify-center cursor-pointer"
              onClick={() => setPreviewFile(file)}
            >
              {file.fileType.startsWith("image/") ? (
                <img src={file.url || "/placeholder.svg"} alt={file.name} className="h-full w-full object-contain" />
              ) : (
                <div className="text-4xl">{getFileIcon(file.fileType)}</div>
              )}
            </div>

            <div className="p-3">
              <div className="flex justify-between items-start">
                <div className="truncate pr-2">
                  <h3 className="font-medium text-gray-900 truncate">{file.name}</h3>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => onToggleSelect(file.id)}
                    className="text-gray-500 hover:text-blue-500"
                    title="Select file"
                  >
                    {selectedFiles.includes(file.id) ? "✓" : "☐"}
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={loading}
                      className="text-gray-500 hover:text-red-500"
                      title="Delete file"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {previewFile && <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

export default FileList

