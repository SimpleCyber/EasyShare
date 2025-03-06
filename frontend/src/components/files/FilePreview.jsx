"use client"

import { useEffect, useRef } from "react"

const FilePreview = ({ file, onClose }) => {
  const modalRef = useRef(null)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  const renderPreview = () => {
    const { fileType, url, name } = file

    if (fileType.startsWith("image/")) {
      return <img src={url || "/placeholder.svg"} alt={name} className="max-h-[80vh] max-w-full object-contain" />
    }

    if (fileType.startsWith("video/")) {
      return (
        <video controls className="max-h-[80vh] max-w-full">
          <source src={url} type={fileType} />
          Your browser does not support the video tag.
        </video>
      )
    }

    if (fileType.startsWith("audio/")) {
      return (
        <div className="p-8 bg-gray-100 rounded-lg">
          <div className="text-4xl text-center mb-4">🎵</div>
          <audio controls className="w-full">
            <source src={url} type={fileType} />
            Your browser does not support the audio tag.
          </audio>
        </div>
      )
    }

    if (fileType === "application/pdf") {
      return <iframe src={`${url}#view=FitH`} title={name} className="w-full h-[80vh]" />
    }

    // For other file types, show download link
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">📄</div>
        <p className="mb-4">Preview not available for this file type.</p>
        <a
          href={url}
          download={name}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Download File
        </a>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-medium truncate">{file.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-4">{renderPreview()}</div>

        <div className="p-4 border-t flex justify-between">
          <div className="text-sm text-gray-500">
            {file.fileType} • {(file.size / 1024).toFixed(2)} KB
          </div>
          <a href={file.url} download={file.name} className="text-blue-600 hover:text-blue-800">
            Download
          </a>
        </div>
      </div>
    </div>
  )
}

export default FilePreview

