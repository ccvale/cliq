type Props = {
    redirectPage: string;
}

export default function Loading({ redirectPage }: Props) {

    /*
        NAME

            Loading - component for the loading spinner

        SYNOPSIS

            Loading({ redirectPage }: Props)
            - redirectPage: string - the page that the user is being redirected to ("/chat", "/dashboard", etc.)

        DESCRIPTION

            This component returns code to render a loading spinner. It takes in the redirectPage prop, which is the page that the user is being redirected to. We use this to determine what message to show the user while the page is loading. If the user is being redirected to the chat page, we show a message that says "Making sure we have your latest messages!" Otherwise, we show a message that says "Making sure we find you the newest users!". This is being done to make sure that some of the live data is always up to date when the user navigates to a new page. We use the redirectPage prop to determine what message to show the user. This might not be necessary, and a possible means of overengineering, but I think it's a nice touch to add this loading message to the user experience, especially in situations where the user is waiting for live data to load.
    */



    // based on page that is loading, show a different message (the only two pages that will have loading are chat and dashboard, so we only need to account for those two pages here)
    let message = "Making sure we find you the newest users!"; // default, for dashboard

    // if we are redirecting to the chat page, show a different message
    if (redirectPage === "/chat") { //
        message = "Making sure we have your latest messages!";
    }

    // return the loading spinner with a familiar style, and the message that we want to show the user
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="text-center">
                <div className="animate-spin mb-2 rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto" style={{ userSelect: 'none' }}></div>
                <h1 className="text-2xl font-bold mb-4 text-white hover:text-indigo-200 transition-colors duration-200" style={{ userSelect: 'none' }}>Give us one sec...</h1>
                <h2 className="text-2xl font-bold mb-4 text-white hover:text-indigo-200 transition-colors duration-300" style={{ userSelect: 'none' }}>{message}</h2>
            </div>
        </div>
    );
};