'use client'

import Image from "next/image"
import nextLogo from "@/public/click_logo_black.png"
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline"
import { Cog8ToothIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import { useEffect } from "react"


export default function Navbar() {
    const { user, isLoaded } = useUser();

    return (
        <nav className="flex justify-between items-center py-6 font-bold w-4/5 mx-auto bg-white">
            <h1 className="text-2xl">
                <Link href="/">
                    <div className="cursor-pointer hover:-translate-y-1 transition-transform duration-300">
                        <Image src={nextLogo} width={90} height={100} alt="Cliq logo" />
                    </div>
                </Link>
            </h1>
            <div className="flex gap-4 items-center">
                {
                    isLoaded && user && (
                        <>
                            <Link href="/chat">
                                <ChatBubbleOvalLeftEllipsisIcon className="text-black-400 w-10 h-10" />
                            </Link>
                            <Link href="/settings">
                                <Cog8ToothIcon className="text-black-400 w-10 h-10" />
                            </Link>
                            <UserButton afterSignOutUrl='/' userProfileUrl='/profile'/>
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