import { getXataClient } from "@/xata";
import { currentUser } from "@clerk/nextjs";
import ChatComponent from "../components/ChatComponent";

export default async function Chat() {
    const xataClient = getXataClient();
    const user = await currentUser();

    const sessionUserRaw = await xataClient.db.Users.filter({ 'userId': user?.id }).getFirst();
    const sessionUser = { ...sessionUserRaw };
    
    const matchMessages = await xataClient.db.messages.filter({
        $any: [
            { sender_id: sessionUserRaw?.userId },
            { receiver_id: sessionUserRaw?.userId }
        ]
    }).getMany();


    let userDetails: { id: string; userId: string; displayName: string; imageUrl: string; }[] = [];

    if (sessionUser?.matches) {
        userDetails = sessionUser.matches.map(match => {
            const [id, userId, displayName, imageUrl] = match.split(' - ');
            return { id, userId, displayName, imageUrl };
        });
    }

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

    return (
        <ChatComponent sessionUser={sessionUser} userDetails={userDetails} matchMessages={matchMessages.toSerializable()} />
    );
}