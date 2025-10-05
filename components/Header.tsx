import React from 'react';

interface HeaderProps {
    onOpenApiModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenApiModal }) => {
    return (
        <header className="bg-slate-800/50 backdrop-blur-sm shadow-md p-4 border-b border-slate-700 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                     <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                    </svg>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                        Gemini Vision Chat
                    </h1>
                </div>

                <button
                    onClick={onOpenApiModal}
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded hover:bg-green-700 transition-colors flex-shrink-0"
                >
                    API Externo
                </button>
            </div>
        </header>
    );
};

export default Header;
