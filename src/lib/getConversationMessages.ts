export default async function getConversationMessages(userId1: string, userId2: string) {
    const requestBody = {
        "columns": ["*"],
        "filter": {
            "sender_id": { "$any": [userId1, userId2] },
            "receiver_id": { "$any": [userId1, userId2] }
        }

    };

    const options = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81', // Replace with your actual key
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