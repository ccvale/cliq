import { auth } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default function Home() {

  const { userId } = auth();

  if (userId) {
    redirect("/dashboard")
  }

  return (
    <section className="bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 w-4/5 flex flex-col justify-center items-center gap-10 mx-auto grow mb-10 drop-shadow-lg text-center font-bold background-animate">
      <h1 className="text-6xl">
        Making friends has never been easier...
      </h1>
      <p className="text-4xl">
        Why not give it a try?
      </p>
      <Link href="/sign-up">
        <button
          className="text-2xl bg-gray-50 text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100">
          Get Started
        </button>
      </Link>
    </section>
    
  );
}
