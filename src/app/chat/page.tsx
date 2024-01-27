import { getXataClient } from "@/xata";
import { currentUser } from "@clerk/nextjs";
import ChatComponent from "../components/ChatComponent";

export default async function Chat() {
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

    // handling case where user has matches - we *do* want to render the full chat component
    return (
        <ChatComponent sessionUser={sessionUser} userDetails={userDetails} matchMessages={sanitizedMessages} />
    );
}