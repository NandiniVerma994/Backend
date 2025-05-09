#Understanding backend

Model link
https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj


Important info
https://chatgpt.com/share/681dee28-8910-8007-a593-57fed1db51ec

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

User logs in → backend gives access token + refresh token.
Access token is sent in each request → backend checks it.
If access token expires → frontend sends refresh token to backend.
Backend checks refresh token → gives a new access token.


What are cookies?
Cookies are small pieces of data stored in the user’s browser.
They are sent automatically to the server with every request from browser to server.
Cookies are often used to:
Keep users logged in (store session IDs or tokens)
Remember user preferences (like language, theme)
Track user behavior (for analytics or ads)

cookie-parser is a middleware for Express.(readable format me nhi aata so it needs to be parsed)
It reads the cookies sent by the browser and parses them into a usable JS object

Cookies are small pieces of data that a website stores in your browser.
They are sent back and forth between the browser and the server every time you visit the site.
Every time you load a page, the server forgets who you are.
Example: You log in → click to another page → the server has no memory you were logged in!
So, we need cookies to remember important information between requests.
Main reasons we use cookies
1️⃣ To remember login sessions
When you log in, the server sends a cookie like: session_id=abc123
The browser stores it and sends it with every request.
The server reads the cookie and knows:
→ “Ah, it’s Nandini! She’s logged in!”


                          ┌──────────────┐
                          │  index.js    │
                          │ (entry point)│
                          └──────┬───────┘
                                 │
                        ┌────────▼────────┐
                        │     app.js      │
                        │  (sets up app) │
                        └────────┬────────┘
                                 │
        ┌────────────────┬───────┼────────┬─────────────────┐
        │                │       │        │                 │
 ┌──────▼─────┐   ┌──────▼──────┐ ┌──────▼──────┐   ┌──────▼─────┐
 │  middlewares│   │   routes    │ │ controllers │   │   models    │
 │ (auth, logs)│   │ (API paths) │ │(request logic)│ │(DB schemas) │
 └─────────────┘   └──────┬──────┘ └──────┬──────┘   └──────┬─────┘
                          │               │                │
                          └─────┬─────────┴────────┬───────┘
                                │                  │
                         ┌──────▼─────┐    ┌──────▼─────┐
                         │    db      │    │   utils    │
                         │(DB connect)│    │(helpers)   │
                         └────────────┘    └────────────┘
controllers
→ Contains functions that handle incoming requests and send responses.
Example: logic for user signup, login, profile handling.

db
→ Manages database connection and setup.
Example: MongoDB, PostgreSQL, or MySQL connection code.

middlewares
→ Contains functions that run between the request and response.
Example: authentication checks, error handling, logging.

models
→ Defines the data structure (schema) and interacts with the database.
Example: user model, product model, order model.

routes
→ Defines API endpoints and links them to controller functions.
Example: GET /users, POST /login.
router.get('/profile', userController.getProfile);
When someone asks for /profile, the waiter (route) calls the getProfile function.

utils
→ Contains helper functions and reusable utilities.
Example: email validators, password hashers, date formatters.

app.js
→ Main application setup; configures middlewares, routes, etc.
Example: app.use(), app.listen().

constants.js
→ Stores constant values used across the project.
Example: status codes, API keys, environment names.

index.js
→ Entry point of the app; often starts the server by calling app.js.
This is the first file the computer looks at when starting your app.

app.js → sets up the Express app + exports it
index.js → imports the app + runs app.listen() to start the server

app.use() → you’re adding middlewares or routes to the app.
app.listen() → you tell the app to start the server and wait for requests.
app.get() / app.post() → you define what the app should do when someone visits a certain URL.


Axios -> a library to make http request
Example use:
On frontend → send user registration form to backend.
On backend → call another external API.

Express -> A lightweight web framework for node.js. It is used to build server side apps 
that can handle routes, requests and responses
Example use:
Create backend APIs like /register, /login, /products.

cookie-parser
Middleware for Express to parse cookies from the browser.
Why we use it: So the server can easily read cookies sent by the client, like: session info

cors
(Cross-Origin Resource Sharing)
Middleware that lets backend accept requests from different domains 

bcrypt
A library to hash passwords securely.
So we never store raw passwords in the database → only store the hashed version.

cloudinary
A cloud service to upload, store, and manage images and videos.
So we don’t store heavy media files on our server → we upload them to Cloudinary and store only the URL in the database.

JWT(json web token) -> create + verify auth tokens
You log into a website.
The website needs to remember that you are logged in when you visit different pages
✅ Instead of asking for your username & password every time, it gives you a token (a secret pass) after you log in once
You show the token each time you visit a new page, and the website knows you are the same person.


When a user logs in → backend creates a JWT.
Backend sends that JWT to the frontend.
Frontend stores the JWT in a cookie (or sometimes in localStorage).
On every request, the browser automatically sends the cookie back to the backend.
Backend reads the cookie, extracts the JWT, and verifies it to check if the user is logged in.
The JWT is not saved in the database; it's a temporary token that is used for authentication and authorization.

Multer acts as a middleware to process file uploads before your main logic runs.
When the frontend uploads an image (using a form), it sends the file as multipart/form-data → this is not readable by default in Node.js.
Multer:
Parses that multipart/form-data.
Pulls out the files (e.g., avatar, coverImage).
Stores them in memory (RAM) or temporarily on disk.
Makes the files available in req.files or req.file for backend use.
(middleware automatically attaches the uploaded file(s) to the req (request) object:
If you upload one file, it goes into req.file
If you upload multiple files, they go into req.files
This lets your backend code access the uploaded file data easily)
Then you can take that extracted file and:
Upload it to Cloudinary using its API.
Clean up any temporary storage.
Without multer, you’d have no clean access to the file data, and Cloudinary’s upload function wouldn’t know what to upload.

In short multer will first save the file into the local disk and then transfer it to cloudinary. Why not directly to cloudinary (reason given above)


| ✅ **Plugin (.plugin)**                                 | ✅ **Schema method (.methods)**                                  |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| Works on the **whole model (Video)**                   | Works on a **single document (a video instance)**               |
| Adds **global methods** (like Video.aggregatePaginate) | Adds methods for **only 1 document** (like video.generateToken) |
| Example: paginate all videos                           | Example: hash password for 1 video document                     |

Pagination is not something you do on 1 video.
Pagination is done on the whole collection of videos (many videos).