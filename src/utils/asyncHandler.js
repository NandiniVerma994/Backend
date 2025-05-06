// handles error all the functions like register user and all is wrapped inside this to handle 
// error if thrown 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).
        catch((err) => next(err))
    }
}

export {asyncHandler}

// requestHandler: This is the asynchronous function passed as a parameter (in this case,
//  registerUser).
// Promise.resolve(requestHandler(...)): This line makes sure that the requestHandler
//  function is wrapped as a promise and resolved properly.
// .catch((err) => next(err)): If an error occurs in the requestHandler, it is caught 
// and passed to the next function, which hands the error to Express' error-handling middleware.




// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }