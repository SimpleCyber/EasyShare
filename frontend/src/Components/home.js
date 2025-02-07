import React, { useState } from 'react';
import { Upload, FileText, Share2, Clock, Settings, User, Search } from 'lucide-react';
import { Card, CardContent } from '../Components/ui/card';

const ShareItNow = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [recentFiles] = useState([
    { name: 'Project Report.pdf', size: '2.4 MB', date: '2 hours ago' },
    { name: 'Meeting Notes.docx', size: '1.1 MB', date: '5 hours ago' },
    { name: 'Images.zip', size: '15.7 MB', date: 'Yesterday' }
  ]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle file drop logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Share2 className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">ShareItNow</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Settings className="h-6 w-6 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <User className="h-6 w-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <Card className="mb-8">
          <CardContent>
            <div
              className={`mt-4 p-8 border-2 border-dashed rounded-lg text-center ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Drop your files here
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                or click to browse (up to 100MB)
              </p>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Select Files
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Files */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:px-6 border-b">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400" />
              <h3 className="ml-2 text-lg font-medium text-gray-900">Recent Files</h3>
            </div>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentFiles.map((file, index) => (
              <li key={index} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {file.size} • {file.date}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-500">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
};

export default ShareItNow;