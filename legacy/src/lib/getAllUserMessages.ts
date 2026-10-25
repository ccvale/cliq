export default async function getAllUserMessages(userId: string) {

    /*
        NAME

        getAllUserMessages - function called to get all the messages sent and received by the user

        SYNOPSIS

        getAllUserMessages(userId)
            - userId: string - the id of the user whose messages we want to retrieve

        DESCRIPTION
        
            This function is called when we want to get all the messages sent and received by the user. We use the POST method to retrieve the messages for the user, since we are not creating or updating any data. This function is called when the user heads over to the chat page, and we want to display their messages. This allows us to fetch the messages for the user and display them in the UI later on.
    */
    
    // we want all messages that were sent by the user - or received by the user
    const requestBody = {
        'columns': ['*'],
        'filter': {
            'sender_id': { '$any': [userId] },
            'receiver_id': { '$any': [userId] }
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