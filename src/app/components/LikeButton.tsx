'use client'

import { useState } from 'react';
import React from 'react'
import TinderCard from 'react-tinder-card'
import { onSwipe } from '@/lib/onSwipe'
import { onCardLeftScreen } from '@/lib/onCardLeftScreen'
import HandThumbUpIcon from '@heroicons/react/24/outline/esm/HandThumbUpIcon'

// Move handleLike definition above the component
const handleLike = () => {
    // Add your logic here, such as sending a like to the server
    console.log("Liked!");
};

export default function LikeButton() {
    return (
        <div className="w-1/2 flex justify-end p-4 cursor-pointer">
            <HandThumbUpIcon className="text-green-500 w-12 h-12" onClick={() => console.log('clicked')}/>
        </div>
    );
}