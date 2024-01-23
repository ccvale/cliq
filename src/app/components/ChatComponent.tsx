'use client';
import React, { useState, useEffect } from 'react';

// Simulated chat history
const fakeChatHistory = {
    0: [{ sender: "other", text: "Hello there!" }, { sender: "user", text: "Hi!" }],
    1: [{ sender: "other", text: "How's it going?" }],
    // Add more chat history for other users if needed
};

type Props = {
    sessionUser: any,
    userDetails: any
}

export default function ChatComponent({ sessionUser, userDetails }: Props) {
    const [activeChat, setActiveChat] = useState(null);
    const [currentChatHistory, setCurrentChatHistory] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Load chat history when active chat changes
    useEffect(() => {
        if (activeChat !== null) {
            setCurrentChatHistory(fakeChatHistory[activeChat] || []);
        }
    }, [activeChat]);

    const handleSendMessage = () => {
        if (newMessage.trim() !== "") {
            const updatedChatHistory = [...currentChatHistory, { sender: "user", text: newMessage }];
            setCurrentChatHistory(updatedChatHistory);
            setNewMessage(""); // Clear the input field
        }
    };

    return (
        <div className="flex h-screen">
            {/* Left panel */}
            <div className="w-2/3 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
                <h1 className="text-xl font-semibold mb-4">Hello, {sessionUser?.display_name}</h1>
                <div>
                    {userDetails.length > 0 ? (
                        userDetails.map((match, index) => (
                            <div key={index}
                                className={`flex items-center mb-4 p-2 rounded-lg cursor-pointer ${activeChat === index ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                                onClick={() => setActiveChat(index)}>
                                <img src={match.imageUrl} alt={match.displayName} className="h-12 w-12 rounded-full mr-3" />
                                <div>
                                    <p className="font-medium">{match.displayName}</p>
                                    <p className="text-sm text-gray-600">Last message preview...</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No matches found.</p>
                    )}
                </div>
            </div>

            {/* Right panel (Chat interface) */}
            <div className="w-2/3 flex flex-col h-5/6">
                {/* Chat Header */}
                {activeChat !== null && (
                    <div className="p-3 border-b border-gray-300">
                        <h2 className="text-lg font-semibold">{userDetails[activeChat].displayName}</h2>
                    </div>
                )}

                {/* Message Display Area - Adjusted for fixed-height typing area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100% - 4rem)' }}>
                    {currentChatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : ""}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-2 rounded-lg ${msg.sender === "user" ? "bg-blue-100" : "bg-gray-100"}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Typing Area */}
                {activeChat !== null && (
                    <div className="p-3 border-t border-gray-300 flex bg-white">
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                            className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
                            placeholder="Type a message..." />
                        <button onClick={handleSendMessage} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-2">
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

