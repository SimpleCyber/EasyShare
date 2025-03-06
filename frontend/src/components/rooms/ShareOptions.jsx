"use client"

import { useState, useRef, useEffect } from "react"
import { useRoom } from "../../context/RoomContext"

const ShareOptions = ({ roomId, selectedFiles, onClose }) => {
  const [shareType, setShareType] = useState("room")
  const [copied, setCopied] = useState(false)
  const { generateShareLink } = useRoom()
  const linkRef = useRef(null)
  const modalRef = useRef(null)

  const shareLink =
    shareType === "files" && selectedFiles.length > 0
      ? generateShareLink(roomId, selectedFiles)
      : generateShareLink(roomId)

  const copyToClipboard = () => {
    linkRef.current.select()
    document.execCommand("copy")
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Share</h2>

        <div className="mb-4">
          <div className="flex space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="shareType"
                value="room"
                checked={shareType === "room"}
                onChange={() => setShareType("room")}
                className="mr-2"
              />
              Share entire room
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                name="shareType"
                value="files"
                checked={shareType === "files"}
                onChange={() => setShareType("files")}
                className="mr-2"
                disabled={selectedFiles.length === 0}
              />
              Share selected files
              {selectedFiles.length > 0 && ` (${selectedFiles.length})`}
            </label>
          </div>

          {shareType === "files" && selectedFiles.length === 0 && (
            <p className="text-red-500 text-sm mb-4">Please select files to share first</p>
          )}

          <div className="flex">
            <input
              ref={linkRef}
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ShareOptions

