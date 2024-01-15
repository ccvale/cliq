import React from 'react'
import Card from '../components/Card'
import LikeButton from '../components/LikeButton'
import DislikeButton from '../components/DislikeButton'
import { generateRandomUser } from '@/lib/generateRandomUser';
import { auth, currentUser, getAuth } from '@clerk/nextjs/server'
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/outline';
import ArrowUpCircleIcon from '@heroicons/react/24/outline';
import ArrowDownCircleIcon from '@heroicons/react/24/outline';

/**
 * When the user is authenticated, this is the page they will see.
 * This is the main page of the application, essentially.
 * Other user cards will be displayed here, and the user will be able to swipe right or left on them.
 * 
 * I am temporarily using a dummy card to test the functionality of the card and swipe features.
 */

// we will want to load in the user auth, and the xata client, and filter by users in a near location, then send those users to the card component

export default async function dashboard() {
  const user = await currentUser(); //seems to work
  console.log(user.id);
  //console.log(user);
  return (
    <>
      <Card params={
        {
          user: generateRandomUser(),
          }
        }
       />
      <div className="flex flex-row justify-center items-center mx-auto -mt-8 gap-56">
        {/* <DislikeButton />
        <LikeButton /> */}
        <ArrowLeftCircleIcon className="text-red-400 w-14 h-14" />
        <ArrowRightCircleIcon className="text-green-400 w-14 h-14" />
      </div>
      <div>
        <section className="flex flex-col justify-center items-center text-center p-5">
          <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300">Don't be shy! Swipe right if you like what you see!</h1>
          <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300">No worries if you don't; we'll get you another card right away!</h1>
        </section>
      </div>
    </>
  )
}