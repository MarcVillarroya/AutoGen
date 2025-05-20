// src/components/RecorderControls.tsx
import React from 'react';

interface RecorderControlsProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  onSave?: () => void; // Ahora es opcional
}

const RecorderControls: React.FC<RecorderControlsProps> = ({
  isRecording,
  onStart,
  onStop,
  onSave, // Destructure onSave
}) => {
  const [stopped, setStopped] = React.useState(false);
  const [isSaved, setIsSaved] = React.useState(false); // Add isSaved state

  React.useEffect(() => {
    if (isRecording) {
      setStopped(false);
      setIsSaved(false); // Reset saved state when recording starts
    }
  }, [isRecording]);

  const handleButtonClick = () => {
    if (!isRecording && !stopped) {
      onStart();
    } else if (isRecording) {
      onStop();
      setStopped(true);
      setIsSaved(false); // Ensure isSaved is false when stopping
    } else if (stopped && !isSaved) {
      // This case might be handled by a separate save button
      // For now, clicking "Stopped" again resets to initial state
      setStopped(false);
    } else if (stopped && isSaved) {
      // After saving, clicking "Saved" resets to initial state
      setStopped(false);
      setIsSaved(false);
    }
  };

  const handleSaveClick = () => {
    onSave?.();
    setIsSaved(true);
  };

  let buttonText = 'Start Recording';
  let buttonClass = 'bg-green-500 hover:bg-green-600 text-white';
  let showSaveButton = false;

  if (isRecording) {
    buttonText = 'Recording...';
    buttonClass = 'bg-yellow-500 text-white animate-pulse cursor-wait';
  } else if (stopped && !isSaved) {
    buttonText = 'Stopped';
    buttonClass = 'bg-red-500 hover:bg-red-600 text-white'; // Changed color for "Stopped"
    showSaveButton = true; // Show save button when stopped and not saved
  } else if (stopped && isSaved) {
    buttonText = 'Code Saved';
    buttonClass = 'bg-blue-500 text-white'; // Indicate saved state
  }

  return (
    <div className="flex items-center justify-center p-4 bg-gray-800 rounded-xl space-x-4">
      <button
        onClick={handleButtonClick}
        disabled={isRecording && false}
        className={`px-6 py-2 rounded-lg font-semibold transition-colors duration-200 ${buttonClass}`}
      >
        {buttonText}
      </button>
      {showSaveButton && (
        <button
          onClick={handleSaveClick}
          className="px-6 py-2 rounded-lg font-semibold transition-colors duration-200 bg-purple-500 hover:bg-purple-600 text-white"
        >
          Save Code
        </button>
      )}
    </div>
  );
};

export default RecorderControls;
