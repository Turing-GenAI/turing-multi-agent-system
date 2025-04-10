interface BreadcrumbNavProps {
  trial: string;
  selectedDocument?: {
    id: number;
    title: string;
  } | null;
}

export function BreadcrumbNav({ trial, selectedDocument }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <span>{trial}</span>
      <span className="text-gray-400">/</span>
      <span>Documents</span>
      {selectedDocument && (
        <>
          <span className="text-gray-400">/</span>
          <span>#{selectedDocument.id} {selectedDocument.title}</span>
        </>
      )}
    </nav>
  )
}