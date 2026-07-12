import { useState, useCallback } from 'react';
import { useUploadFlow } from '@/hooks/use-upload-flow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Image as ImageIcon, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function UploadFlow() {
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const { progress, startUpload } = useUploadFlow();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  }, []);

  const handleStart = () => {
    if (!title.trim() || files.length === 0) return;
    startUpload(title, files);
  };

  const isUploading = progress.status !== 'idle' && progress.status !== 'error' && progress.status !== 'done';
  const progressPercent = progress.totalPhotos > 0 
    ? Math.round((progress.uploadedPhotos / progress.totalPhotos) * 100) 
    : 0;

  if (isUploading) {
    return (
      <div className="bg-card border border-card-border p-8 md:p-12 rounded-lg max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif">Dispatching Correspondent</h2>
          <p className="text-muted-foreground font-sans">
            {progress.status === 'creating' && "Opening a new assignment..."}
            {progress.status === 'uploading' && `Developing negatives... ${progress.uploadedPhotos} of ${progress.totalPhotos}`}
            {progress.status === 'processing' && "Our correspondent is reviewing your itinerary, mapping coordinates, and writing the story..."}
          </p>
        </div>
        
        <div className="space-y-2">
          <Progress value={progress.status === 'processing' ? 100 : progressPercent} className="h-2" />
          {progress.status === 'uploading' && (
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{progressPercent}% COMPLETE</p>
          )}
        </div>

        {progress.status === 'processing' && (
          <div className="flex items-center justify-center text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-3 font-mono text-sm tracking-widest uppercase">Researching location history</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-none p-6 md:p-10 shadow-sm max-w-3xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-serif italic mb-4">Submit a Story</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Provide a folder of photos from your latest journey. Our AI correspondent will analyze the locations, research the terrain, and file a comprehensive feature.
        </p>
      </div>

      <div className="space-y-8">
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">The Assignment</label>
          <Input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. A Weekend in Kyoto, Autumn in the Dolomites..."
            className="text-lg py-6 font-serif placeholder:font-sans bg-background/50 border-border focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex justify-between">
            <span>The Negatives</span>
            {files.length > 0 && <span>{files.length} selected</span>}
          </label>
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-10 text-center transition-colors duration-200 group relative",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50",
              files.length > 0 ? "bg-accent/30" : ""
            )}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className="h-16 w-16 rounded-full bg-background flex items-center justify-center border border-border group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-lg">Tap to select photos</p>
                <p className="text-sm text-muted-foreground mt-1">or drag and drop photos here</p>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> JPG, PNG, HEIC</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> EXIF required for maps</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button 
            size="lg" 
            onClick={handleStart} 
            disabled={!title.trim() || files.length === 0}
            className="w-full sm:w-auto font-serif text-lg tracking-wide rounded-none group"
          >
            Dispatch Correspondent
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
