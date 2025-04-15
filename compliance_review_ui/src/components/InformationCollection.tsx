import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiRefreshCw } from 'react-icons/fi';

interface TrialMetadata {
  trialPhase: string;
  productType: string;
  geography: string;
  riskLevel: string;
  regulatoryPathway: string;
  trialTitleId: string;
}

interface ComplianceHint {
  regulation: string;
  description: string;
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

  // Load saved metadata from localStorage on component mount
  useEffect(() => {
    const savedMetadata = localStorage.getItem('trialMetadata');
    if (savedMetadata) {
      setFormData(JSON.parse(savedMetadata));
    }
  }, []);

  // Update compliance hints when form data changes
  useEffect(() => {
    updateComplianceHints();
  }, [formData]);

  const updateComplianceHints = () => {
    const hints: ComplianceHint[] = [];

    // Static rules for compliance hints
    if (formData.productType === 'Device') {
      hints.push({
        regulation: '21 CFR Part 812',
        description: 'IDE Regulations for Medical Devices'
      });
    }

    if (formData.geography === 'International' && formData.trialPhase === 'Phase 3') {
      hints.push({
        regulation: 'ICH E6(R2)',
        description: 'Guidelines for International Phase 3 Trials'
      });
    }

    if (formData.riskLevel === 'Significant risk') {
      hints.push({
        regulation: '21 CFR Part 50',
        description: 'Protection of Human Subjects'
      });
    }

    setComplianceHints(hints);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

      {/* Side Panel for Compliance Hints */}
      <div className="w-80 bg-gray-50 p-6 border-l border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recommended Compliance Documents
        </h3>
        
        {complianceHints.length > 0 ? (
          <div className="space-y-4">
            {complianceHints.map((hint, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="text-green-600 font-medium mb-1">✓ {hint.regulation}</div>
                <div className="text-sm text-gray-600">{hint.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            Fill out the form to see recommended compliance documents based on your selections.
          </p>
        )}
      </div>
    </div>
  );
}; 