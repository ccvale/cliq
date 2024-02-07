export default async function removeMessages(baseUrl: string, messageIds: any) {
    /*
        NAME

            removeMessages - function called to remove messages from the database

        SYNOPSIS

            removeMessages(baseUrl, messageIds)
            - baseUrl (string): API endpoint for deleting messages
            - messageIds (string[]): array containing the IDs of messages to be deleted

        DESCRIPTION

        Function called to remove messages from the database by their IDs. 
        It executes a DELETE request for each messageId to the server, and waits for all deletions to complete.
        Since we are deleting messages, we have to delete them individually, and we iterate through each messageId to perform a fetch DELETE request.

        The function returns a Promise that resolves once all messages have been deleted.
    */
    
    const actualIds = messageIds['arg'];


    // Iterate through each messageId and perform a fetch DELETE request
    const deletePromises = actualIds.map((messageId) => {

        const options = {
            method: 'DELETE', // since we are deleting a message, we use the DELETE method
            headers: {
                Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81',
                'Content-Type': 'application/json'
            },
        };

        return fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/messages/data/${messageId}`, options)
            .then(response => {
                if (!response.ok) {
                    // if the response is not ok, throw an error
                    throw new Error(`Failed to delete message ${messageId}: ${response.statusText}`);
                }
                // but if we do get a response, return the response as a JSON object (if it exists)
                return response.text().then(text => text ? JSON.parse(text) : {});
            })
            .then(response => console.log(`Deleted message ${messageId}:`, response))
            .catch(err => console.error(`Error deleting message ${messageId}:`, err));
    });

    try {
        await Promise.all(deletePromises);
        console.log("All specified messages have been deleted.");
    } catch (err) {
        console.error("An error occurred while deleting messages:", err);
    }
}