export default async function getConversationMessages(userId1: string, userId2: string) {

    /*
        NAME

        getConversationMessages - function called to get all the messages sent and received by the user within a given conversation

        SYNOPSIS

        getConversationMessages(userId)
            - userId1: string - the id of a user whose messages we want to retrieve
            - userId2: string - the id of a user whose messages we want to retrieve

        DESCRIPTION

            This function is called when we want to get all the messages sent and received by the user within a given conversation. We use the POST method to retrieve the messages for the user, since we are not creating or updating any data. This function is called when the user heads over to the chat page, and we want to display their messages. This allows us to fetch the messages for the user and display them in the UI later on.
        
    */
    
    // differs from getAllUserMessages in that we want messages sent by either user - or received by either user within this given conversation
    const requestBody = {
        'columns': ['*'],
        'filter': {
            'sender_id': { '$any': [userId1, userId2] },
            'receiver_id': { '$any': [userId1, userId2] }
        }

    };

    const options = {
        method: 'POST',
        headers: {
            Authorization: process.env.NEXT_PUBLIC_XATA_BEARER || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    };


    try {
        const response = await fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/messages/query`, options);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonResponse = await response.json();
        return jsonResponse;
    } catch (err) {
        console.error(err);
        throw err;
    }
}