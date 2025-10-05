import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import Message from './Message';
import Spinner from './Spinner';

interface ChatWindowProps {
    messages: ChatMessage[];
    isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    return (
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg) => (
                    <Message key={msg.id} message={msg} />
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex items-center space-x-3 bg-slate-800 p-3 rounded-lg">
                            <Spinner />
                            <span className="text-slate-400 animate-pulse">Gemini is thinking...</span>
                        </div>
                    </div>
                )}
                 {messages.length === 0 && !isLoading && (
                    <div className="text-center text-slate-500 pt-20">
                        <p className="text-xl">Welcome to Gemini Vision Chat!</p>
                        <p>Type a message or upload an image to get started.</p>
                    </div>
                )}
            </div>
        </main>
    );
};

export default ChatWindow;
