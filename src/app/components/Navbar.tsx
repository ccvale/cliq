'use client';

import { MouseEvent, useState } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import Loading from '@/app/components/Loading';

export default function Navbar() {

    /*
        NAME

            Navbar - component for the navigation bar at the top of the page

        SYNOPSIS

            Navbar()

        DESCRIPTION

            This function returns code to render the navigation bar at the top of the page. It uses the useUser hook from Clerk to determine if the user is signed in or not. If they are signed in, they will see the chat, settings, and sign out buttons. If they are not signed in, they will see the sign in button. Also, the logo is a link to the dashboard if the user is signed in, and a link to the home page if the user is not signed in, because the dashboard is the main page of the application when the user is signed in, and the home page is the main page of the application when the user is not signed in.

            We also have a loading state for when the user navigates to the chat or dashboard page. This is because we want to show a loading spinner while the page is loading. We use the handleNavigation function to set the loading state and redirect the user to the page they clicked on. We use the isLoading state to determine if the loading spinner should be shown, and the redirectPage state to determine where the user should be redirected to.
    */

    const { user, isLoaded } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [redirectPage, setRedirectPage] = useState("");

    const handleNavigation = (e: MouseEvent<HTMLAnchorElement, MouseEvent>, href: string) => {
        // being used as a more explicit way to refresh on navigation - instances where we want to make sure all data is up to date
        // because of this, we are leveraging this href assignment, and using a loading spinner to show the user that we are loading the page

        e.preventDefault();

        // set loading state and redirect
        setRedirectPage(href);
        setIsLoading(true);
        setTimeout(() => {
            window.location.href = href;
        }, 0); // don't want any delay
    };

    // logic here: we render the general navbar, ad based on user/load state, we render the appropriate buttons for the user to interact with
    // if we are loading, show the loading spinner
    // if we are not loading, show the navbar
    // the navbar will have the logo, and the chat, settings, and sign out buttons if the user is signed in
    // if the user is not signed in, show the sign in button instead
    return (
        <>
            {isLoading && <Loading redirectPage={redirectPage} />}
            <nav className="flex justify-between items-center py-6 font-bold w-4/5 mx-auto bg-white">
                <h1 className="text-2xl">
                    <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <a href={user ? "/dashboard" : "/"} onClick={(e) => { if (user) handleNavigation(e, "/dashboard"); }}>
                            <img src="/click_logo_black.png" width={90} height={100} alt="Cliq logo" />
                        </a>
                    </div>
                </h1>

                <div className="flex gap-4 items-center">
                    {isLoaded && user && (
                        <>
                            <a href="/chat" onClick={(e) => handleNavigation(e, "/chat")}>
                                <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                    <ChatBubbleOvalLeftEllipsisIcon className="w-10 h-10" />
                                </div>
                            </a>

                            <Link href="/settings">
                                <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                    <Cog8ToothIcon className="w-10 h-10" />
                                </div>
                            </Link>

                            <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </>
                    )}
                    {isLoaded && !user && (
                        <Link href="/sign-in">
                            <button className="bg-gradient-to-r from-indigo-400 to-indigo-400 text-white px-4 py-2 rounded-lg hover:from-indigo-300 hover:to-indigo-300">Sign In</button>
                        </Link>
                    )}
                </div>
            </nav>
        </>
    );
}