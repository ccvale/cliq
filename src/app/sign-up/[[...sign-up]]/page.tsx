import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    
    /*
        NAME

            SignUpPage - page the user is directed to after clicking the "Get Started" button on the home page

        SYNOPSIS

            SignUpPage()

        DESCRIPTION

            This function returns the JSX elements that make up the sign up page. It uses the SignUp component from Clerk to render the sign up form. Functionality here is essentially allowing the user to interact with the Clerk sign up form, and then redirecting them to the dashboard page after they have signed in. (This is the same as the sign in page, but with a different component)
    */
    
    // logic here: simply rendering the sign up page, which contains the SignUp Clerk component that allows the user to sign up
    return (
        <section className="flex flex-row justify-between items-center bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 w-4/5 mx-auto mb-10 drop-shadow-lg">

            <div className="flex-grow space-y-4">
                <h1 className="text-6xl font-bold">
                    You&apos;ve made the right choice!
                </h1>

                <p className="text-4xl font-semibold">
                    You&apos;re just a few clicks away from making new friends!
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