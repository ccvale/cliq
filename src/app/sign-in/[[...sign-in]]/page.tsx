import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <section className="flex flex-row justify-between items-center bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 w-4/5 mx-auto mb-10 drop-shadow-lg">
            <div className="flex-grow space-y-4">
                <h1 className="text-6xl font-bold">
                    Welcome back!
                </h1>
                <p className="text-4xl font-semibold">
                    You already know what to do...
                </p>
            </div>
            <div className="flex-none">
                <SignIn
                    afterSignInUrl='/dashboard'
                    appearance={{
                        elements: {
                            formButtonPrimary: "bg-gradient-to-r from-indigo-400 to-indigo-400 text-white px-4 py-2 rounded-lg hover:from-indigo-300 hover:to-indigo-300",
                        },
                    }}
                />
            </div>
        </section>
    );
}