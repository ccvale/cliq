import { getXataClient } from '@/xata';
import { auth } from '@clerk/nextjs/server';
import React from 'react'
import SettingsPage from '../components/SettingsPage';
import { revalidatePath } from 'next/cache';

export default async function Settings() {
  
  /*
        NAME

            Settings - function that is responsible for all the logic being passed to the settings page

        SYNOPSIS

            Settings()

        DESCRIPTION

            This function is responsible for getting the current user, and then rendering the settings page with the user's data. It also handles the case where the user doesn't exist in the xata database, and adds them to the database. We are doing this because the user is authenticated and exists in the clerk database, but we want to add them to the xata database so that we can store their preferences and other data. In many cases (such as this one), to access the data that relates to user settings for the card, we need to use the xata database, because the clerk database doesn't have this data. To do this, we need to acquire the user id from the clerk database, and use that to obtain the information for the xata user. The record is serialized so that it can be passed to the settings page without causing errors. 
    */
  
  const { userId } = auth();
  const xataClient = getXataClient();
  const fetchedUser = await xataClient.db.Users.filter(userId ? { 'userId': userId } : undefined).getFirst();
  
  // if the user doesn't exist in the xata database, we want to add them (they are authenticated and exist in the clerk database first)
  // when we revalidate path, we are essentially telling the page to re-render with the new data
    
    /* if (!fetchedUser) {
        if (userId) {
          await xataClient.db.Users.create({ userId });
          revalidatePath('/settings');
        }
      revalidatePath('/settings');
    } */
  
  // (have a better way to do this now, but leaving this here for reference/just in case)

  // we need to serialize the record so that it can be passed to the settings page without causing errors
  const record = fetchedUser ? fetchedUser.toSerializable() : null;
  
  // we will always have a record, because if the user doesn't exist in the xata database, we add them
  // but for the sake of type safety, we will check if the record exists before rendering the settings page
  if (record) {
    return (
      <SettingsPage record={record} />
    )
  }       
}
