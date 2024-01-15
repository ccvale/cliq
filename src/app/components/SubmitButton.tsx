import { getXataClient } from '@/xata';
import { auth } from '@clerk/nextjs';
import React from 'react'

// create function called onSubmit
async function onSubmit() {
    
}

export default function SubmitButton() {
  return (
      <button onClick={onSubmit} type="submit" className="text-xl bg-gray-50 text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100 mt-4">
          Save
      </button>
  )
}
