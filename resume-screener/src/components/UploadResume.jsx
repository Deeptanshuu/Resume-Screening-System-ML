import { useState } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from './ProgressBar';

const UploadResume = ({ onAnalyze, jobFile }) => {
  const [resumeFiles, setResumeFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const validateFiles = (files) => {
    const validFiles = [];
    const invalidFiles = [];

    Array.from(files).forEach(file => {
      if (file.type === 'application/pdf' || file.type === 'text/plain') {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      alert(`The following files are not supported: ${invalidFiles.join(', ')}\nPlease upload only PDF or TXT files.`);
    }

    return validFiles;
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
    
    const files = validateFiles(e.dataTransfer.files);
    if (files.length) {
      setResumeFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileInput = (e) => {
    const files = validateFiles(e.target.files);
    if (files.length) {
      const newFiles = [...files];
      setResumeFiles(prev => [...prev, ...newFiles]);
      
      newFiles.forEach(file => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));
        
        simulateFileUpload(file.name);
      });
    }
  };

  const simulateFileUpload = (fileName) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(prev => ({
        ...prev,
        [fileName]: progress
      }));
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const removeFile = (index) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (!jobFile) {
      alert('Please upload a job description first');
      return;
    }
    if (resumeFiles.length === 0) {
      alert('Please upload at least one resume');
      return;
    }
    if (resumeFiles.length > 10) {
      alert('Maximum 10 resumes can be processed at once');
      return;
    }
    onAnalyze(resumeFiles);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Resumes</h3>
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          {resumeFiles.length > 0 ? (
            <div className="space-y-4">
              {resumeFiles.map((file, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                    <div className="px-3">
                      <ProgressBar progress={uploadProgress[file.name]} />
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={handleAnalyze}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Analyze Resumes
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="h-12 w-12 text-indigo-500">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              </div>
              <div className="text-gray-600">
                <label className="block text-lg font-medium mb-2">
                  Drop your resumes here
                </label>
                <span className="text-sm">or</span>
              </div>
              <div>
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
                  Browse Files
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt"
                    multiple
                    onChange={handleFileInput}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500">PDF and TXT files are supported</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

UploadResume.propTypes = {
  onAnalyze: PropTypes.func.isRequired,
  jobFile: PropTypes.object,
};

export default UploadResume; 