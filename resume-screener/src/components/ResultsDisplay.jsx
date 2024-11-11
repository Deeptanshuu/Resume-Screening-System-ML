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
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Pie, Radar } from 'react-chartjs-2';
import { PDFDocument, rgb } from 'pdf-lib';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const ResultsDisplay = ({ results }) => {
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterScore, setFilterScore] = useState(0);
  
  if (!results || !results.candidates) return null;

  // Sort candidates by match score in descending order
  const sortedCandidates = results.candidates.filter(c => c.matchScore >= filterScore);

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

  // Prepare radar chart data for skills comparison
  const getRadarData = (candidate) => ({
    labels: results.requiredSkills,
    datasets: [{
      label: 'Skills Match',
      data: results.requiredSkills.map(skill => 
        candidate.skillsFound.includes(skill) ? 100 : 0
      ),
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2,
    }]
  });

  const radarOptions = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        suggestedMin: 0,
        suggestedMax: 100
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Minimum Match Score:
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filterScore}
            onChange={(e) => setFilterScore(Number(e.target.value))}
            className="w-48"
          />
          <span className="text-sm text-gray-600">{filterScore}%</span>
        </div>
      </div>

      {/* Demographics Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Analysis Overview</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Summary Statistics */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Total Candidates</h4>
              <p className="text-2xl font-bold text-indigo-600">{sortedCandidates.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Average Match Score</h4>
              <p className="text-2xl font-bold text-indigo-600">
                {(sortedCandidates.reduce((acc, curr) => acc + curr.matchScore, 0) / sortedCandidates.length || 0).toFixed(2)}%
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700">Top Skills Found</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {results.requiredSkills.slice(0, 5).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Candidate Skills Radar */}
          <div className="col-span-2 bg-white rounded-lg p-4 border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Skills Analysis</h4>
            {selectedCandidate ? (
              <Radar data={getRadarData(selectedCandidate)} options={radarOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a candidate to view skills analysis
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Candidate Rankings</h3>
          <button
            onClick={() => {/* Generate PDF */}}
            disabled={selectedCandidates.size === 0}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
              ${selectedCandidates.size > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
          >
            Export Selected
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {sortedCandidates.map((candidate, index) => (
            <div 
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className={`p-6 transition-colors cursor-pointer ${
                selectedCandidate?.id === candidate.id
                  ? 'bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.has(candidate.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleCandidateSelection(candidate.id);
                    }}
                    className="h-5 w-5 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        {candidate.name}
                        {index < 3 && (
                          <span>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        {candidate.matchScore.toFixed(1)}%
                      </div>
                      <p className="text-sm text-gray-500">match score</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Experience</p>
                      <p className="font-medium text-gray-900">{candidate.experience} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Education</p>
                      <p className="font-medium text-gray-900">{candidate.education}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {candidate.skillsFound.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className={`px-2 py-1 rounded-full text-xs ${
                            results.requiredSkills.includes(skill)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
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