"use client";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (template: string) => void;
}

const templates = [
  { id: "modern", name: "Modern", description: "Clean and contemporary" },
  { id: "classic", name: "Classic", description: "Traditional and professional" },
  { id: "minimal", name: "Minimal", description: "Simple and elegant" },
];

export default function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: TemplateSelectorProps) {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Select Template
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            className={`
              p-4 border-2 rounded-lg text-left transition-all
              ${
                selectedTemplate === template.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }
            `}
          >
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-gray-500">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}


