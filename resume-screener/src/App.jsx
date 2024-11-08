import { useState, useEffect } from 'react';
import UploadResume from './components/UploadResume';
import ResultsDisplay from './components/ResultsDisplay';
import LoginScreen from './components/LoginScreen';
import JobDescription from './components/JobDescription';

// Mock data for demonstration
// const mockResults = {
//   requiredSkills: [
//     'React',
//     'JavaScript',
//     'TypeScript',
//     'Node.js',
//     'MongoDB',
//     'AWS',
//     'GraphQL',
//   ],
//   candidates: [
//     {
//       id: '1',
//       name: 'John Doe',
//       email: 'john.doe@example.com',
//       matchScore: 85,
//       skillsFound: [
//         'React',
//         'JavaScript',
//         'TypeScript',
//         'Node.js',
//         'Python',
//         'AWS',
//         'Docker',
//         'Git',
//       ],
//       experience: 4,
//       education: 'Master of Computer Science',
//       location: 'San Francisco, CA',
//     },
//     {
//       id: '2',
//       name: 'Jane Smith',
//       email: 'jane.smith@example.com',
//       matchScore: 92,
//       skillsFound: [
//         'React',
//         'JavaScript',
//         'TypeScript',
//         'Node.js',
//         'MongoDB',
//         'AWS',
//         'GraphQL',
//         'Docker',
//       ],
//       experience: 6,
//       education: 'Bachelor of Software Engineering',
//       location: 'New York, NY',
//     },
//     {
//       id: '3',
//       name: 'Mike Johnson',
//       email: 'mike.johnson@example.com',
//       matchScore: 78,
//       skillsFound: [
//         'React',
//         'JavaScript',
//         'Node.js',
//         'MongoDB',
//         'Express',
//         'Redis',
//       ],
//       experience: 3,
//       education: 'Bachelor of Computer Science',
//       location: 'Austin, TX',
//     },
//   ],
// };

function App() {
  const [currentStep, setCurrentStep] = useState('upload'); // Changed to just 'upload' and 'results'
  const [results, setResults] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobFile, setJobFile] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogin = (username) => {
    setUser(username);
    localStorage.setItem('user', username);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setResults(null);
    setCurrentStep('upload');
  };

  const handleAnalyze = async (resumeFiles) => {
    if (!jobFile) {
      alert('Please upload a job description first');
      return;
    }

    setCurrentStep('analyzing');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('job_description', jobFile);
      
      // Append multiple resume files
      for (let i = 0; i < resumeFiles.length; i++) {
        formData.append('resumes', resumeFiles[i]);
      }

      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process files');
      }

      const data = await response.json();
      setResults(data); // The backend now returns data in the correct format
      setCurrentStep('results');
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing files: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const LoadingScreen = () => (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-700">
          {currentStep === 'analyzing' ? 'Analyzing Resumes...' : 'Processing Job Description...'}
        </p>
      </div>
    </div>
  );

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoading && <LoadingScreen />}
      
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900">Resume Screener</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user}</span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="space-y-8">
            {currentStep === 'upload' && (
              <section className="transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload Documents</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <JobDescription onJobSubmit={setJobFile} />
                  <UploadResume onAnalyze={handleAnalyze} jobFile={jobFile} />
                </div>
              </section>
            )}

            {currentStep === 'results' && (
              <section className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
                <ResultsDisplay results={results} />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
