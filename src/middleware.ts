import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware

// This is another generated file that is used to protect routes from unauthorized access

export default authMiddleware({
    publicRoutes: ['/', '/api/updateUser', '/api/newMessage/db/click:main/tables/messages/data']
});

export const config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};