import { useState } from 'react';
import React from 'react';
import HandThumbUpIcon from '@heroicons/react/24/outline/esm/HandThumbUpIcon';

export default function LikeButton() {
    const [isLiked, setIsLiked] = useState(false);

    const handleLike = () => {
        setIsLiked(!isLiked);
        // Add additional logic here if needed, such as sending a like to the server
    };

    return (
        <button className= "w-1/2 flex justify-end p-4" onClick = { handleLike } >
            <HandThumbUpIcon className={ `text-${isLiked ? 'green' : 'gray'}-500 w-12 h-12` } />
        < /button>
    );
}
