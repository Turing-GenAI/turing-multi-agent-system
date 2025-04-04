import { useState } from 'react'
import * as Checkbox from '@radix-ui/react-checkbox'
import { FiCheck } from 'react-icons/fi'
import { DocumentDetails } from './DocumentDetails'

const sampleContent = `
<h1>Informed Consent Form</h1>
<p><strong>Study Title:</strong> Investigating the Impact of Innovative Medication on Chronic Pain<br/>
<strong>Principal Investigator:</strong> Dr. Sarah Thompson<br/>
<strong>Contact Information:</strong><br/>
Phone: (555) 987-6543<br/>
Email: sarah.thompson@clinicaltrials.com</p>

<p><strong>Purpose of the Study:</strong><br/>
You are invited to take part in a research study aimed at assessing the effectiveness and safety of a new medication intended to relieve chronic pain.</p>

<p><strong>Study Procedures:</strong><br/>
If you choose to participate, you will go through the following steps:</p>
<ul>
<li>Initial screening visit to check eligibility</li>
<li>Random assignment to either the treatment or placebo group</li>
<li>Regular follow-up visits over a span of 12 weeks</li>
<li>Filling out questionnaires about your pain levels and overall health</li>
</ul>

<p><strong>Dosing:</strong><br/>
Use the device as needed when pain occurs.</p>

<p><strong>Confidentiality:</strong><br/>
Your personal information will remain confidential and will only be utilized for research purposes.</p>

<p><strong>Voluntary Participation:</strong><br/>
Your involvement is voluntary, and you can withdraw at any time without facing any penalties.</p>

<p><strong>Consent:</strong><br/>
By signing below, you confirm that you have read and understood the information provided and agree to participate in this study.</p>
<p>Signature: _______________________<br/>
Date: _______________________</p>
`

const sampleWarnings = [
  {
    id: 1,
    text: "Sentence is inaccurate",
    current: "Use the device as needed when pain occurs.",
    suggested: "To be used under the supervision of a licensed healthcare practitioner for the relief of pain. The practitioner should determine the appropriate frequency and conditions for use.",
    regulation: "21 CFR § 801.109(c)"
  },
  {
    id: 2,
    text: "Missing required information",
    current: "Your personal information will remain confidential.",
    suggested: "Your personal information will remain confidential and will be protected according to HIPAA guidelines.",
    regulation: "45 CFR § 164.520"
  }
]

interface DocumentListProps {
  onDocumentSelect: (doc: { id: number; title: string }) => void;
  selectedDocument: { id: number; title: string } | null;
}

export function DocumentList({ onDocumentSelect, selectedDocument }: DocumentListProps) {
  const documents = [
    { 
      id: 1, 
      title: 'Informed Consent Form', 
      warnings: 2, 
      format: 'PDF', 
      created: 'Apr 12 2024, 6:20 PM', 
      updated: '4 months ago',
      content: sampleContent
    },
    { 
      id: 2, 
      title: 'Privacy Policy', 
      warnings: 2, 
      format: 'TXT', 
      created: 'Mar 15 2024, 1:45 PM', 
      updated: '5 months ago',
      content: ''
    },
  ]

  const [selectedDocs, setSelectedDocs] = useState<number[]>([])
  const [activeDocument, setActiveDocument] = useState<typeof documents[0] | null>(null)

  const handleDocumentClick = (doc: typeof documents[0]) => {
    setActiveDocument(doc);
    onDocumentSelect(doc);
  };

  if (activeDocument) {
    return (
      <DocumentDetails 
        document={{
          ...activeDocument,
          warnings: sampleWarnings
        }}
        onClose={() => {
          setActiveDocument(null);
          onDocumentSelect({ id: 0, title: '' });
        }}
      />
    )
  }

  return (
    <div className="mt-8">
      <table className="w-full">
        <thead>
          <tr className="text-left">
            <th className="pb-4 font-normal">
              <Checkbox.Root
                className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                checked={selectedDocs.length === documents.length}
                onCheckedChange={(checked) => {
                  setSelectedDocs(checked ? documents.map(d => d.id) : [])
                }}
              >
                <Checkbox.Indicator>
                  <FiCheck className="h-3 w-3" />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </th>
            <th className="pb-4 font-normal">ID</th>
            <th className="pb-4 font-normal">Title</th>
            <th className="pb-4 font-normal">Warnings to review</th>
            <th className="pb-4 font-normal">File format</th>
            <th className="pb-4 font-normal">Created</th>
            <th className="pb-4 font-normal">Last updated</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr 
              key={doc.id} 
              className="border-t border-gray-100 cursor-pointer hover:bg-gray-50"
              onClick={() => handleDocumentClick(doc)}
            >
              <td className="py-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox.Root
                  className="flex h-4 w-4 items-center justify-center rounded border border-gray-300"
                  checked={selectedDocs.includes(doc.id)}
                  onCheckedChange={(checked) => {
                    setSelectedDocs(
                      checked
                        ? [...selectedDocs, doc.id]
                        : selectedDocs.filter(id => id !== doc.id)
                    )
                  }}
                >
                  <Checkbox.Indicator>
                    <FiCheck className="h-3 w-3" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
              </td>
              <td className="py-4">{doc.id}</td>
              <td className="py-4">{doc.title}</td>
              <td className="py-4">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-warning/10 rounded-full text-warning">
                  {doc.warnings}
                </span>
              </td>
              <td className="py-4">{doc.format}</td>
              <td className="py-4">{doc.created}</td>
              <td className="py-4">{doc.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <span>1 of 100 row(s) selected.</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select className="border border-gray-200 rounded px-2 py-1">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div>
            Page 1 of 10
          </div>
        </div>
      </div>
    </div>
  )
}