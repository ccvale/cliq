/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/a/**',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
                port: '',
                pathname: '/u/**',
            },
            {
                protocol: 'https',
                hostname: 'static-cdn.jtvnw.net',
                port: '',
                pathname: '/jtv_user_pictures/**',
            },
            {
                protocol: 'https',
                hostname: 'placekitten.com',
                port: '',
                pathname: '/500/**',
            }
        ],
    },

}

/**
 * This is needed to make the remote images work with our application.
 * For example, when we are receiving a user profile picture from a Kinde sign-in/sign-up, we need to make sure
 * that the image is understood by our application, so that we are able to use it moving forward.
 */

module.exports = nextConfig