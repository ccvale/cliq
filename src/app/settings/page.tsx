import { UsersRecord, getXataClient } from '@/xata';
import { auth, currentUser } from '@clerk/nextjs/server';
import React, { useEffect, useState } from 'react'
import { redirect, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
//import { paletteOptions } from '../../../types'
import SettingsPage from '../components/SettingsPage';
import { revalidatePath } from 'next/cache';

export default async function Settings() {
  const { userId } = auth();
  const xataClient = getXataClient();
  const fetchedUser = await xataClient.db.Users.filter({ 'userId': userId }).getFirst();
  
    
    if (!fetchedUser) {
        await xataClient.db.Users.create({userId});
        revalidatePath('/settings');
    }

    const record = fetchedUser.toSerializable();
           
  return (
    <SettingsPage record={record} cid={userId} />
  )
}
