'use client'

import { ChatBubbleOvalLeftEllipsisIcon } from '@heroicons/react/24/outline'
import { Cog8ToothIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'


export default function Navbar() {
    /*
        NAME

            Navbar - component for the navigation bar at the top of the page

        SYNOPSIS

            Navbar()

        DESCRIPTION

            This function returns code to render the navigation bar at the top of the page. It uses the useUser hook from Clerk to determine if the user is signed in or not. If they are signed in, they will see the chat, settings, and sign out buttons. If they are not signed in, they will see the sign in button. Also, the logo is a link to the dashboard if the user is signed in, and a link to the home page if the user is not signed in, because the dashboard is the main page of the application when the user is signed in, and the home page is the main page of the application when the user is not signed in.
    */
    
    // grabbing the user, and the load state
    const { user, isLoaded } = useUser();

    // logic here: we render the general navbar, ad based on user/load state, we render the appropriate buttons for the user to interact with
    return (
        <nav className="flex justify-between items-center py-6 font-bold w-4/5 mx-auto bg-white">

            <h1 className="text-2xl">
                <Link href={user ? "/dashboard" : "/"}>
                    
                    <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <img src="/click_logo_black.png" width={90} height={100} alt="Cliq logo" />
                    </div>

                </Link>
            </h1>

            <div className="flex gap-4 items-center">
                {
                    isLoaded && user && (
                        <>
                            <Link href="/chat">
                                <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                    <ChatBubbleOvalLeftEllipsisIcon className="text-black-400 w-10 h-10" />
                                </div>
                            </Link>

                            <Link href="/settings">
                                <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                    <Cog8ToothIcon className="text-black-400 w-10 h-10" />
                                </div>
                            </Link>

                            <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                <UserButton afterSignOutUrl='/' />
                            </div>
                        </>
                    )
                }
                {
                    isLoaded && !user && (
                        <Link href='/sign-in'>
                            <button className="bg-gradient-to-r from-indigo-400 to-indigo-400 text-white px-4 py-2 rounded-lg hover:from-indigo-300 hover:to-indigo-300">Sign In</button>
                        </Link>
                    )
                }
            </div>
        </nav>
    );
}