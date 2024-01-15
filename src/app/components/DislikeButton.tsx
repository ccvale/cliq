import React from 'react'
import HandThumbDownIcon from '@heroicons/react/24/outline/esm/HandThumbDownIcon'
import { handleDislike } from '@/lib/handleDislike'

export default function DislikeButton() {
  return (
    <button className="w-1/2 flex justify-end p-4" onClick={handleDislike}>
      <HandThumbDownIcon className='text-red-500 w-12 h-12'/>
    </button>
  )
}
