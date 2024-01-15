import { getXataClient } from '@/xata';
import { auth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
    // Implement logic to retrieve userId based on your authentication method
    const { userId } = auth();

    const xataClient = getXataClient();
    let fetchedUser = await xataClient.db.Users.filter({ userId }).getFirst();

    if (!fetchedUser) {
        fetchedUser = await xataClient.db.Users.create({ userId });
    }

    //res.status(200).json(fetchedUser.toSerializable());
    //return fake data for now
    
    res.status(200).json({
        "id": "1234",
        "name": "John Doe",
        "email": "cval@c.com"
    });
}