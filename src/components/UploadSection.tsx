import { useCallback } from "react";
import { Upload } from "lucide-react";

interface UploadSectionProps {
  title: string;
  description: string;
  onUpload: (data: string[][]) => void;
  accept?: string;
}

export const UploadSection = ({
  title,
  description,
  onUpload,
  accept = ".csv",
}: UploadSectionProps) => {
  const parseCSV = (text: string): string[][] => {
    const lines = text.trim().split("\n");
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const data = parseCSV(text);
        onUpload(data);
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [onUpload]
  );

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-foreground font-medium">{title}</h3>
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        </div>
      </div>
      <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
        <Upload className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Upload CSV</span>
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
};
