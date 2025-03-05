import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Trash2, 
  Edit, 
  Share2, 
  Sun, 
  Moon, 
  FileDown 
} from 'lucide-react';

// Main App Component
const FileShareApp = () => {
  const [theme, setTheme] = useState('light');
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Theme Toggle
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Fetch Files
  const fetchFiles = async () => {
    try {
      const response = await fetch('/');
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // File Upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Create Share Link
  const createShareLink = async () => {
    try {
      const response = await fetch('/create-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: selectedFiles })
      });
      const data = await response.json();
      // Copy share link to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/share/${data.shareLink}`);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Share creation error:', error);
    }
  };

  // File Type Icon
  const FileTypeIcon = ({ type }) => {
    switch (type) {
      case 'image': return <Image className="text-blue-500" />;
      case 'video': return <Video className="text-green-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };

  // Render
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">File Share</h1>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {theme === 'light' ? <Moon /> : <Sun />}
            </button>

            {/* Upload Button */}
            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Upload className="mr-2" /> Upload
              </motion.div>
            </label>
          </div>
        </header>

        {/* Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {files.map((file) => (
              <motion.div 
                key={file.filename}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`
                  ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} 
                  p-4 rounded-lg shadow-md flex flex-col
                `}
              >
                {/* File Preview/Icon */}
                <div className="flex items-center justify-center h-40 mb-4">
                  {file.type === 'image' ? (
                    <img 
                      src={file.url} 
                      alt={file.filename} 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <FileTypeIcon type={file.type} className="w-16 h-16" />
                  )}
                </div>

                {/* File Details */}
                <div className="flex justify-between items-center">
                  <span className="truncate max-w-[150px]">{file.filename.split('/').pop()}</span>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.open(file.url, '_blank')}
                      className="hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
                    >
                      <FileDown size={18} />
                    </button>
                    <button 
                      className="hover:bg-gray-200 dark:hover:bg-gray-700 p-1 rounded"
                      onClick={() => {
                        const newName = prompt('Enter new filename:', file.filename.split('/').pop());
                        if (newName) {
                          // Implement rename logic
                        }
                      }}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="hover:bg-red-100 hover:text-red-600 p-1 rounded"
                      onClick={() => {
                        // Implement delete logic
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Select for Sharing */}
                <div className="mt-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={selectedFiles.includes(file.filename)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles([...selectedFiles, file.filename]);
                        } else {
                          setSelectedFiles(selectedFiles.filter(f => f !== file.filename));
                        }
                      }}
                    />
                    Select to Share
                  </label>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Share Button */}
        {selectedFiles.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center"
            onClick={createShareLink}
          >
            <Share2 className="mr-2" /> Share {selectedFiles.length} Files
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default FileShareApp;