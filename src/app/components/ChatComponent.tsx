'use client';
import React, { useState, useEffect } from 'react';
import useSWRMutation from 'swr/mutation';
import newMessage from '@/lib/newMessage';

type Props = {
    sessionUser: any,
    userDetails: any,
    matchMessages: any
}

export default function ChatComponent({ sessionUser, userDetails, matchMessages }: Props) {
    const [activeChat, setActiveChat] = useState(null);
    const [currentChatHistory, setCurrentChatHistory] = useState([]);
    const [nMessage, setNewMessage] = useState("");
    const [organizedChats, setOrganizedChats] = useState({});

    const { trigger } = useSWRMutation('/api/newMessage', newMessage);

    // Organize chat messages by conversation
    useEffect(() => {
        const chats = {};
        matchMessages.forEach(message => {
            const otherUserId = message.sender_id === sessionUser.userId ? message.receiver_id : message.sender_id;
            if (!chats[otherUserId]) {
                chats[otherUserId] = [];
            }
            chats[otherUserId].push(message);
        });
        setOrganizedChats(chats);
    }, [matchMessages, sessionUser.userId]);


    // Load chat history when active chat changes
    useEffect(() => {
        if (activeChat !== null) {
            setCurrentChatHistory(organizedChats[activeChat] || []);
        }
    }, [activeChat, organizedChats]);

    const handleSendMessage = async () => {
        if (nMessage.trim() !== "") {
            const newMsg = {
                sender_id: sessionUser.userId,
                receiver_id: activeChat,
                message: nMessage,
                // Add other fields like timestamps if needed
            };

            // Update the currentChatHistory
            setCurrentChatHistory(prevHistory => [...prevHistory, newMsg]);

            // Also update organizedChats with the new message
            setOrganizedChats(prevChats => ({
                ...prevChats,
                [activeChat]: [...(prevChats[activeChat] || []), newMsg]
            }));

            setNewMessage(""); // Clear the input field

            // Send the message to the server
            try {
                const response = await trigger(newMsg);
                console.log("Message sent, server response:", response);
            } catch (error) {
                console.error("Failed to send message:", error);
                // Handle failed message sending (e.g., show an error message)
            }
        }
    };

    return (
        <div className="flex h-screen">
            {/* Left panel */}
            <div className="w-2/3 bg-gray-100 border-r border-gray-300 p-4 overflow-y-auto">
                <h1 className="text-xl font-semibold mb-4">Chats</h1>
                <div>
                    {userDetails.map((user, index) => {
                        const lastMessage = organizedChats[user.userId] ? organizedChats[user.userId][organizedChats[user.userId].length - 1] : null;
                        const lastMessageTime = lastMessage ? new Date(lastMessage.xata?.updatedAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                            <div key={index}
                                className={`flex items-center mb-4 p-2 rounded-lg cursor-pointer ${activeChat === user.userId ? 'bg-gray-300' : 'hover:bg-gray-200'}`}
                                onClick={() => setActiveChat(user.userId)}>
                                <img src={user.imageUrl} alt={user.displayName} className="h-12 w-12 rounded-full mr-3" />
                                <div className="flex flex-col flex-grow">
                                    <div className="flex justify-between">
                                        <p className="font-medium">{user.displayName}</p>
                                        <p className="text-xs text-gray-500">{lastMessageTime}</p>
                                    </div>
                                    {lastMessage && (
                                        <p className="text-sm text-gray-600">{lastMessage.message}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right panel (Chat interface) */}
            <div className="w-2/3 flex flex-col h-5/6">
                {/* Chat Header */}
                {activeChat !== null && userDetails.find(user => user.userId === activeChat) && (
                    <div className="p-3 border-b border-gray-300">
                        <h2 className="text-lg font-semibold">{userDetails.find(user => user.userId === activeChat).displayName}</h2>
                    </div>
                )}

                {/* Message Display Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100% - 4rem)' }}>
                    {activeChat && organizedChats[activeChat] && organizedChats[activeChat].map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender_id === sessionUser.userId ? "justify-end" : ""}`}>
                            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-2 rounded-lg ${msg.sender_id === sessionUser.userId ? "bg-blue-100" : "bg-gray-100"}`}>
                                {msg.message}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Typing Area */}
                {activeChat !== null && (
                    <div className="p-3 border-t border-gray-300 flex bg-white">
                        <input type="text" value={nMessage} onChange={e => setNewMessage(e.target.value)}
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