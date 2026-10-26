import { auth } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {

  /*
        NAME

            Home - the home page of the application

        SYNOPSIS

            Home()

        DESCRIPTION

            The home page of the application; this is the first page the user will see when they visit the site. Users are greeted with a message explaining that they can make friends easily with Cliq, and a button that will redirect them to sign in or sign up, depending on whether or not they are using the application for the first time.
    */

  // check if the user is already signed in - if they are, redirect them to the dashboard (users have no need to access the home page if they are already signed in)
  const { userId } = auth();

  // we don't want to show the home page to users who are already signed in
  if (userId) {
    redirect('/dashboard')
  }

  // logic here: simply rendering the home page, with buttons for the user to sign in or sign up
  return (
    <section className='bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 w-4/5 flex flex-col justify-center items-center gap-10 mx-auto grow mb-10 drop-shadow-lg text-center font-bold background-animate'>

      <h1 className='text-6xl'>
        Making friends has never been easier...
      </h1>

      <p className='text-4xl'>
        Why not give it a try?
      </p>

      <Link href='/sign-up'>
        <button
          className='text-2xl bg-gray-50 text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100'>
          Get Started
        </button>
      </Link>

    </section>
  );
}
