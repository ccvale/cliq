import React from 'react'

export default function NotFound() {

    /*
            NAME

                NotFound - the component that is rendered when the user tries to access a page that doesn't exist

            SYNOPSIS

                NotFound()

            DESCRIPTION

                This component is rendered when the user tries to access a page that doesn't exist. It will display a 404 error message and a link to the home page. It's probably a good idea to have a 404 page in your app, as it's a good user experience to let the user know that the page they're trying to access isn't a real page.
    */

    // logic: simply render a 404 page if the user accesses a page that doesn't exist
    return (
        <div>
            <div className="text-center pt-20 text-6xl text-indigo-700 font-semibold" style={{ userSelect: 'none' }}>
                404
            </div>
            
            <div className="text-center pt-16 text-2xl text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>
                This page doesn&apos;t exist...how about you try one that does?
            </div>
            
      </div>
      
  )
}
