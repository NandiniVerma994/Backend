#Understanding backend

Model link
https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj

#Access Token and Refresh Token
When we log into an app like instagram or you tube, the server needs to know you are logged in for future request, so jwt(json web token comes into future) comes into picture
It uses mainly 2 types of token:
Access Token  -> short lived, used to access protected routes like profiles
Refresh Token -> long term expiry , used to generate a new access token when the old one expires without logging in again
These token are basically encrypted so access token secret.

User requests GET /profile →
Frontend sends access_token → backend checks → ✅ allowed

3️⃣ After 1 day, access token expires →
Frontend requests POST /refresh-token 
Backend checks refresh_token → sends back new access token

4️⃣ If refresh token also expires →
User must log in again


What are cookies?
Cookies are small pieces of data stored in the user’s browser.
They are sent automatically to the server with every request.
Cookies are often used to:
Keep users logged in (store session IDs or tokens)
Remember user preferences (like language, theme)
Track user behavior (for analytics or ads)

cookie-parser is a middleware for Express.
It reads the cookies sent by the browser and parses them into a usable JS object

