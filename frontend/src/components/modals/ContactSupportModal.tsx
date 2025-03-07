import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setMessage('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Here you would typically send the form data to your backend
    console.log('Support request submitted:', { name, email, message });
    
    // For now, just close the modal after submission
    alert('Thank you for your message. Our support team will contact you soon.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Contact Support</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="prose prose-blue max-w-none">
            <div className="bg-blue-50 p-3 rounded-lg mb-4 border-l-4 border-blue-500">
              <h3 className="text-lg font-bold text-blue-800 mb-1">Clinical Trial Audit Assistant Support</h3>
              <p className="text-blue-700 text-sm">Our team is ready to assist you</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 mb-1">Email Support</h4>
                  <a href="mailto:support@clinicaltrialaudit.com" className="text-blue-600 hover:underline text-sm">
                    support@clinicaltrialaudit.com
                  </a>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 mb-1">Phone Support</h4>
                  <p className="text-gray-700 text-sm">+1 (800) 555-1234</p>
                  <p className="text-xs text-gray-500">Mon-Fri, 9am-5pm EST</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold text-gray-800 border-b pb-1 mb-3">Send us a message</h4>
                <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      type="text" 
                      id="name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      id="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="Your email"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      id="message" 
                      rows={3} 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="How can we help you?"
                      required
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Submit
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
