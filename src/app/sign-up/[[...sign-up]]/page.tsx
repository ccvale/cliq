import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <section className="flex flex-row justify-between items-center bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 w-4/5 mx-auto mb-10 drop-shadow-lg">
            <div className="flex-grow space-y-4">
                <h1 className="text-6xl font-bold">
                    You've made the right choice!
                </h1>
                <p className="text-4xl font-semibold">
                    You're just a few clicks away from making new friends!
                </p>
            </div>
            <div className="flex-none">
                <SignUp
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