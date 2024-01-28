import { getXataClient } from "@/xata";
import { currentUser } from "@clerk/nextjs";
import ChatComponent from "../components/ChatComponent";

export default async function Chat() {
    /*
        NAME

            Chat - page that handles the logic for the chat feature of the application

        SYNOPSIS

            Chat()

        DESCRIPTION

            This function has many responsibilities. It is responsible for getting the current user, getting the user's matches, getting all messages that the user has sent or received, and then rendering the chat component with all of this data. It also handles the case where the user has no matches, and renders a message to the user telling them that they have no matches and that they should get out there and make some friends. This function is also responsible for "sanitizing" the messages that the user has sent or received, so that the messages can be passed to the chat component without causing errors.
    */
    
    const xataClient = getXataClient();
    const user = await currentUser();

    const sessionUserRaw = await xataClient.db.Users.filter({ 'userId': user?.id }).getFirst();
    const sessionUser = { ...sessionUserRaw };
    
    // getting all messages that the user has sent or received so it can be filtered later based on conversation
    const matchMessages = await xataClient.db.messages.filter({
        $any: [
            { sender_id: sessionUserRaw?.userId },
            { receiver_id: sessionUserRaw?.userId }
        ]
    }).getAll();

    // is being done to avoid errors re: passing non-serializable data to the client - this is apparently called "sanitizing"
    const serializedMessages = JSON.stringify(matchMessages);
    const sanitizedMessages = JSON.parse(serializedMessages);


    let userDetails: { id: string; userId: string; displayName: string; imageUrl: string; }[] = [];

    // parsing through the matches array (which we formatted in a specific way) to get select user details for each match
    if (sessionUser?.matches) {
        userDetails = sessionUser.matches.map(match => {
            const [id, userId, displayName, imageUrl] = match.split(' - ');
            return { id, userId, displayName, imageUrl };
        });
    }

    // handling case where user has no matches - we don't want to render the full chat component if there are no matches
    // in this case, if the users matches array doesn't exist, or if it exists, but is empty
    if (!sessionUser?.matches || sessionUser.matches.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen" style={{ paddingBottom: '40vh' }}>
                <div className="text-center">
                    <h1 className="text-3xl text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>You don&apos;t have any matches...yet!</h1>
                    <h1 className="text-2xl text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>Get out there and make some friends!</h1>
                </div>
            </div>
        );
    }

    // handling case where user has at least one match - we *do* want to render the full chat component
    return (
        <ChatComponent sessionUser={sessionUser} userDetails={userDetails} matchMessages={sanitizedMessages} />
    );
}