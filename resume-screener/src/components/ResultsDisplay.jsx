import PropTypes from 'prop-types';
import { useState } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { PDFDocument, rgb } from 'pdf-lib';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ResultsDisplay = ({ results }) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  
  if (!results || !results.candidates) return null;

  // Sort candidates by match score in descending order
  const sortedCandidates = results.candidates;

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { height } = page.getSize();
    let yOffset = height - 50;

    // Add title
    page.drawText('Shortlisted Candidates Report', {
      x: 50,
      y: yOffset,
      size: 20,
      color: rgb(0, 0, 0),
    });
    yOffset -= 40;

    // Add date
    page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
      x: 50,
      y: yOffset,
      size: 12,
      color: rgb(0.4, 0.4, 0.4),
    });
    yOffset -= 30;

    // Add candidates
    const selectedCandidatesList = sortedCandidates.filter(c => selectedCandidates.has(c.id));
    
    for (const candidate of selectedCandidatesList) {
      // Add candidate name and match score
      page.drawText(`${candidate.name} - Match Score: ${candidate.matchScore.toFixed(2)}%`, {
        x: 50,
        y: yOffset,
        size: 14,
        color: rgb(0, 0, 0),
      });
      yOffset -= 25;

      // Add email
      page.drawText(`Email: ${candidate.email}`, {
        x: 70,
        y: yOffset,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      yOffset -= 20;

      // Add experience and education
      page.drawText(`Experience: ${candidate.experience} years | Education: ${candidate.education}`, {
        x: 70,
        y: yOffset,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      yOffset -= 20;

      // Add skills
      page.drawText('Skills:', {
        x: 70,
        y: yOffset,
        size: 12,
        color: rgb(0.2, 0.2, 0.2),
      });
      yOffset -= 20;

      const skillsText = candidate.skillsFound.join(', ');
      page.drawText(skillsText, {
        x: 90,
        y: yOffset,
        size: 10,
        color: rgb(0.3, 0.3, 0.3),
      });
      yOffset -= 30;

      // Add separator
      page.drawLine({
        start: { x: 50, y: yOffset },
        end: { x: 545, y: yOffset },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      yOffset -= 20;

      // Check if we need a new page
      if (yOffset < 100) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yOffset = newPage.getSize().height - 50;
      }
    }

    // Save the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shortlisted-candidates.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Prepare data for charts
  const experienceData = {
    labels: ['0-2 years', '3-5 years', '6-8 years', '9+ years'],
    datasets: [{
      label: 'Experience Distribution',
      data: [
        sortedCandidates.filter(c => c.experience < 3).length,
        sortedCandidates.filter(c => c.experience >= 3 && c.experience < 6).length,
        sortedCandidates.filter(c => c.experience >= 6 && c.experience < 9).length,
        sortedCandidates.filter(c => c.experience >= 9).length,
      ],
      backgroundColor: [
        'rgba(99, 102, 241, 0.5)',
        'rgba(99, 102, 241, 0.6)',
        'rgba(99, 102, 241, 0.7)',
        'rgba(99, 102, 241, 0.8)',
      ],
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1,
    }]
  };

  const educationData = {
    labels: Array.from(new Set(sortedCandidates.map(c => c.education))),
    datasets: [{
      label: 'Education Distribution',
      data: Array.from(new Set(sortedCandidates.map(c => c.education)))
        .map(edu => sortedCandidates.filter(c => c.education === edu).length),
      backgroundColor: [
        'rgba(99, 102, 241, 0.6)',
        'rgba(167, 139, 250, 0.6)',
        'rgba(139, 92, 246, 0.6)',
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(167, 139, 250, 1)',
        'rgba(139, 92, 246, 1)',
      ],
      borderWidth: 1,
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Demographics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Candidate Demographics</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Experience Distribution */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Experience Distribution</h4>
            <Bar options={chartOptions} data={experienceData} />
          </div>

          {/* Education Distribution */}
          <div className="bg-white rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Education Distribution</h4>
            <Pie options={pieOptions} data={educationData} />
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700">Total Candidates</h4>
            <p className="text-2xl font-bold text-indigo-600">{sortedCandidates.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700">Average Experience</h4>
            <p className="text-2xl font-bold text-indigo-600">
              {(sortedCandidates.reduce((acc, curr) => acc + curr.experience, 0) / sortedCandidates.length || 0).toFixed(2)} years
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700">Average Match Score</h4>
            <p className="text-2xl font-bold text-indigo-600">
              {(sortedCandidates.reduce((acc, curr) => acc + curr.matchScore, 0) / sortedCandidates.length || 0).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Shortlist Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Shortlisted Candidates</h3>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
              {selectedCandidates.size} selected
            </span>
          </div>
          <button
            onClick={generatePDF}
            disabled={selectedCandidates.size === 0}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg
              ${selectedCandidates.size > 0
                ? 'text-white bg-indigo-600 hover:bg-indigo-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
              }`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Shortlist
          </button>
        </div>
      </div>

      {/* Existing Rankings List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Candidate Rankings</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {sortedCandidates.map((candidate, index) => (
            <div 
              key={candidate.id} 
              className={`p-6 transition-colors ${
                selectedCandidates.has(candidate.id)
                  ? 'bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-6">
                {/* Checkbox for selection */}
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={() => toggleCandidateSelection(candidate.id)}
                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                </div>

                {/* Rank Medal/Number */}
                <div className="flex-shrink-0">
                  {index < 3 ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 font-medium">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Candidate Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{candidate.name}</h4>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{candidate.matchScore.toFixed(4)}%</div>
                      <p className="text-sm text-gray-500">match rate</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Matching Skills Found</h5>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skillsFound.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Missing Required Skills</h5>
                      <div className="flex flex-wrap gap-2">
                        {results.requiredSkills
                          .filter(skill => !candidate.skillsFound.includes(skill))
                          .map((skill, skillIndex) => (
                            <span
                              key={skillIndex}
                              className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium text-gray-900">{candidate.experience} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium text-gray-900">{candidate.education}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

ResultsDisplay.propTypes = {
  results: PropTypes.shape({
    requiredSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
    candidates: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      matchScore: PropTypes.number.isRequired,
      skillsFound: PropTypes.arrayOf(PropTypes.string).isRequired,
      experience: PropTypes.number.isRequired,
      education: PropTypes.string.isRequired,
    })).isRequired,
  }),
};

export default ResultsDisplay; 