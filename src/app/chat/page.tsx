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


    let userDetails: { userId: string; displayName: string; imageUrl: string; }[] = [];

    if (sessionUser?.matches) {
        userDetails = sessionUser.matches.map(match => {
            const [userId, displayName, imageUrl] = match.split(' - ');
            return { userId, displayName, imageUrl };
        });
    }

    return (
        <ChatComponent sessionUser={sessionUser} userDetails={userDetails} matchMessages={matchMessages.toSerializable()} />
    );
}