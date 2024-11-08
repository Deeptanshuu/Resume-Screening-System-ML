import { useState } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from './ProgressBar';

const JobDescription = ({ onJobSubmit }) => {
  const [jobDescriptionFile, setJobDescriptionFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateFile = (file) => {
    if (!file) return false;
    
    if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
      alert('Please upload a PDF or TXT file');
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size should be less than 10MB');
      return false;
    }
    
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      setJobDescriptionFile(file);
      onJobSubmit(file);
      setUploadProgress(100);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setJobDescriptionFile(file);
      onJobSubmit(file);
      setUploadProgress(100);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Job Description</h3>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {jobDescriptionFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-lg font-medium text-gray-900">{jobDescriptionFile.name}</span>
            </div>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs mx-auto space-y-2">
                <ProgressBar progress={uploadProgress} />
                <p className="text-sm text-gray-500">Uploading... {uploadProgress}%</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setJobDescriptionFile(null);
                setUploadProgress(0);
              }}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 text-indigo-500">
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            </div>
            <div className="text-gray-600">
              <label className="block text-lg font-medium mb-2">
                Drop your job description here
              </label>
              <span className="text-sm">or</span>
            </div>
            <div>
              <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={handleFileInput}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Only PDF and TXT files are supported</p>
          </div>
        )}
      </div>
    </div>
  );
};

JobDescription.propTypes = {
  onJobSubmit: PropTypes.func.isRequired,
};

export default JobDescription; 