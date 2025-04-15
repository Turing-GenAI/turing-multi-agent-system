import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiRefreshCw, FiAlertCircle, FiCheck } from 'react-icons/fi';

interface TrialMetadata {
  trialPhase: string;
  productType: string;
  geography: string;
  riskLevel: string;
  regulatoryPathway: string;
  trialTitleId: string;
}

interface ComplianceDocument {
  id: string;
  name: string;
  description: string;
  relevance_score: number;
  content?: string;
}

interface ComplianceHint {
  regulation: string;
  description: string;
  relevance_score: number;
  content?: string;
}

interface InformationCollectionProps {
  onInformationSubmit: (info: TrialMetadata) => void;
}

export const InformationCollection: React.FC<InformationCollectionProps> = ({ onInformationSubmit }) => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<TrialMetadata>({
    trialPhase: '',
    productType: 'Drug',
    geography: '',
    riskLevel: '',
    regulatoryPathway: '',
    trialTitleId: '',
  });

  // Compliance hints based on selections
  const [complianceHints, setComplianceHints] = useState<ComplianceHint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add new state for selected documents
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  // Load saved metadata from localStorage on component mount
  useEffect(() => {
    const savedMetadata = localStorage.getItem('trialMetadata');
    if (savedMetadata) {
      setFormData(JSON.parse(savedMetadata));
    }
  }, []);

  // Update compliance hints when form data changes
  useEffect(() => {
    const fetchComplianceHints = async () => {
      // Only fetch if we have the required fields
      if (!formData.trialPhase || !formData.productType || !formData.geography || !formData.riskLevel) {
        console.log('Missing required fields:', formData);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching compliance hints with data:', formData);
        
        const requestData = {
          trial_phase: formData.trialPhase,
          product_type: formData.productType,
          geography: formData.geography,
          risk_level: formData.riskLevel,
          regulatory_pathway: formData.regulatoryPathway,
          trial_title_id: formData.trialTitleId
        };
        
        console.log('Sending request to backend:', requestData);
        
        const response = await fetch('/api/v1/trial-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        console.log('Response status:', response.status);
        
        const responseText = await response.text();
        console.log('Response text:', responseText);

        if (!response.ok) {
          let errorMessage = 'Failed to fetch compliance hints';
          try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Error parsing response JSON:', e);
          throw new Error('Invalid response format from server');
        }

        console.log('Received data from backend:', data);
        
        if (!data.suggested_compliance_docs) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format from server');
        }

        // Convert backend response to ComplianceHint format
        const hints: ComplianceHint[] = data.suggested_compliance_docs.map((doc: ComplianceDocument) => ({
          regulation: doc.name,
          description: doc.description,
          relevance_score: doc.relevance_score,
          content: doc.content,
        }));

        console.log('Processed hints:', hints);
        setComplianceHints(hints);
      } catch (err) {
        console.error('Error in fetchComplianceHints:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching compliance hints');
        // Fallback to static hints if the API fails
        console.log('Falling back to static hints');
        updateStaticHints();
      } finally {
        setLoading(false);
      }
    };

    // Try to fetch from API first
    fetchComplianceHints().catch(() => {
      // If API fails, use static hints
      updateStaticHints();
    });
  }, [formData]);

  // Fallback static hints
  const updateStaticHints = () => {
    console.log('Generating static hints for:', formData);
    const hints: ComplianceHint[] = [];

    if (formData.productType === 'Device') {
      hints.push({
        regulation: '21 CFR Part 812',
        description: 'IDE Regulations for Medical Devices',
        relevance_score: 0.9,
        content: 'Key requirements for medical device trials including IDE approval, sponsor and investigator responsibilities.'
      });
    }

    if (formData.geography === 'International' && formData.trialPhase === 'Phase 3') {
      hints.push({
        regulation: 'ICH E6(R2)',
        description: 'Guidelines for International Phase 3 Trials',
        relevance_score: 0.95,
        content: 'Good Clinical Practice guidelines for international trials including protocol requirements and safety reporting.'
      });
    }

    if (formData.riskLevel === 'Significant risk') {
      hints.push({
        regulation: '21 CFR Part 50',
        description: 'Protection of Human Subjects',
        relevance_score: 0.85,
        content: 'Requirements for human subject protection including informed consent and IRB oversight.'
      });
    }

    if (formData.productType === 'Drug') {
      hints.push({
        regulation: '21 CFR Part 312',
        description: 'IND Regulations',
        relevance_score: 0.9,
        content: 'Requirements for investigational new drug applications including safety reporting and protocol requirements.'
      });
    }

    console.log('Generated static hints:', hints);
    setComplianceHints(hints);
    setError(null); // Clear any API errors since we have fallback content
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);
    
    // If we have all required fields, update hints immediately
    if (newFormData.trialPhase && newFormData.productType && newFormData.geography && newFormData.riskLevel) {
      console.log('All required fields filled, updating hints');
      updateStaticHints();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem('trialMetadata', JSON.stringify(formData));
    
    // Call the parent's submit handler
    onInformationSubmit(formData);
    
    // Navigate to compliance review
    navigate('/compliance');
  };

  const handleReset = () => {
    setFormData({
      trialPhase: '',
      productType: 'Drug',
      geography: '',
      riskLevel: '',
      regulatoryPathway: '',
      trialTitleId: '',
    });
  };

  // Handle document selection
  const handleDocumentSelect = (regulation: string) => {
    setSelectedDocs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regulation)) {
        newSet.delete(regulation);
      } else {
        newSet.add(regulation);
      }
      return newSet;
    });
  };

  return (
    <div className="flex h-full">
      {/* Main Form Section */}
      <div className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-semibold mb-6">Trial Information Collection</h2>
        
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Trial Phase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trial Phase *
            </label>
            <select
              name="trialPhase"
              value={formData.trialPhase}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Phase</option>
              <option value="Phase 1">Phase 1</option>
              <option value="Phase 2">Phase 2</option>
              <option value="Phase 3">Phase 3</option>
              <option value="Phase 4">Phase 4</option>
            </select>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type *
            </label>
            <div className="flex gap-4">
              {['Drug', 'Device', 'Combination'].map((type) => (
                <label key={type} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="productType"
                    value={type}
                    checked={formData.productType === type}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Geography */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geography *
            </label>
            <select
              name="geography"
              value={formData.geography}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Geography</option>
              <option value="Domestic">Domestic</option>
              <option value="International">International</option>
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level *
            </label>
            <div className="flex gap-4">
              {['Non-significant risk', 'Significant risk'].map((risk) => (
                <label key={risk} className="inline-flex items-center">
                  <input
                    type="radio"
                    name="riskLevel"
                    value={risk}
                    checked={formData.riskLevel === risk}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2">{risk}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Regulatory Pathway */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regulatory Pathway
            </label>
            <select
              name="regulatoryPathway"
              value={formData.regulatoryPathway}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Pathway (Optional)</option>
              <option value="IND">IND</option>
              <option value="IDE">IDE</option>
              <option value="510(k)">510(k)</option>
              <option value="PMA">PMA</option>
              <option value="BLA">BLA</option>
              <option value="NDA">NDA</option>
            </select>
          </div>

          {/* Trial Title/ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trial Title / ID
            </label>
            <input
              type="text"
              name="trialTitleId"
              value={formData.trialTitleId}
              onChange={handleInputChange}
              placeholder="Enter trial title or ID (Optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Submit & Start Review
            </button>
          </div>
        </form>
      </div>

      {/* Enhanced Side Panel for Compliance Hints */}
      <div className="w-96 bg-gray-50 p-6 border-l border-gray-200 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Recommended Compliance Documents
          </h3>
          <span className="text-sm text-gray-500">
            {selectedDocs.size} selected
          </span>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <FiAlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && complianceHints.length > 0 ? (
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {complianceHints.map((hint, index) => (
              <div 
                key={index} 
                className={`bg-white p-4 rounded-lg shadow-sm border transition-colors duration-200 ${
                  selectedDocs.has(hint.regulation)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-300'
                }`}
                onClick={() => handleDocumentSelect(hint.regulation)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      selectedDocs.has(hint.regulation)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'border-gray-300'
                    }`}>
                      {selectedDocs.has(hint.regulation) && <FiCheck className="w-4 h-4" />}
                    </div>
                    <div className="text-green-600 font-medium">{hint.regulation}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {Math.round(hint.relevance_score * 100)}% match
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2 pl-7">{hint.description}</div>
                {hint.content && (
                  <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded pl-7">
                    <div className="font-medium mb-1">Key Points:</div>
                    <div className="whitespace-pre-line">{hint.content}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 text-sm text-center">
              Fill out the form to see recommended compliance documents based on your selections.
            </p>
          </div>
        ) : null}

        {/* Action buttons for selected documents */}
        {selectedDocs.size > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                // Handle selected documents
                console.log('Selected documents:', Array.from(selectedDocs));
                // You can add functionality here to process selected documents
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Process Selected Documents ({selectedDocs.size})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 