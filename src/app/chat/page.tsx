import { getXataClient } from "@/xata";
import { currentUser } from "@clerk/nextjs";
import ChatComponent from "../components/ChatComponent";

export default async function Chat() {
    const xataClient = getXataClient();
    const user = await currentUser();

    const sessionUserRaw = await xataClient.db.Users.filter({ 'userId': user?.id }).getFirst();
    const sessionUser = { ...sessionUserRaw };
    
    let userDetails = [];

    if (sessionUser?.matches) {
        userDetails = sessionUser.matches.map(match => {
            const [userId, displayName, imageUrl] = match.split(' - ');
            return { userId, displayName, imageUrl };
        });
    }

    return (
        <ChatComponent sessionUser={sessionUser} userDetails={userDetails} />
    );
}