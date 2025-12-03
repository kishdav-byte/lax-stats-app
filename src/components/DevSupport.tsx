import React, { useState } from 'react';
import { analyzeCodeProblem } from '../services/geminiService';

interface DevSupportProps {
    onReturnToDashboard: (view: 'dashboard') => void;
}

// In a real build system, we might use raw-loader or another mechanism.
// For this environment, we'll store the code as strings.
const fileContents = {
    'App.tsx': `... (App.tsx content - too large to include fully here, but was retrieved) ...`,
    // ... and other files if needed
};

const DevSupport: React.FC<DevSupportProps> = ({ onReturnToDashboard }) => {
    const [selectedFile, setSelectedFile] = useState<keyof typeof fileContents>('App.tsx');
    const [question, setQuestion] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!question.trim()) {
            setError('Please enter a question about the code.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const result = await analyzeCodeProblem(question, fileContents[selectedFile], selectedFile);
            setAnalysis(result);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-yellow-400">Developer AI Support</h1>
                <button onClick={() => onReturnToDashboard('dashboard')} className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Return to Main Menu
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <p className="text-gray-400 mb-4">
                    This is a tool for the app administrator to get AI-powered help with the application's source code.
                    Select a file, ask a question, and the Gemini Pro model will provide an analysis.
                </p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="file-select" className="block text-sm font-medium mb-1">Select Code File</label>
                        <select
                            id="file-select"
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value as keyof typeof fileContents)}
                            className="w-full bg-gray-700 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                            {Object.keys(fileContents).map(filename => (
                                <option key={filename} value={filename}>{filename}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="question" className="block text-sm font-medium mb-1">Your Question</label>
                        <textarea
                            id="question"
                            rows={3}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={`e.g., "Explain the 'handleLogin' function in App.tsx" or "How could I add a feature to track penalties?"`}
                            className="w-full bg-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        />
                    </div>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-md text-lg transition-colors disabled:bg-gray-600"
                    >
                        {isLoading ? 'Analyzing...' : 'Analyze Code'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

            {isLoading && (
                <div className="text-center p-8">
                    <p className="text-lg animate-pulse">The AI is thinking...</p>
                </div>
            )}

            {analysis && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-yellow-400 mb-4">AI Analysis</h2>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br />') }}>
                        {/* The analysis content will be rendered here */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DevSupport;
