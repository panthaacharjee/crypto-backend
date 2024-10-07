//Create token and saving in cookie
const sendToken = (user, statusCode, res, role) => {
  try {
    const token = user.getJWTToken();
    const roleToken = token + "," + role
    //options for cookie
    const options = {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    res.status(statusCode).cookie("token", roleToken, options).json({
      success: true,
      user,
    });
    // console.log(finalToken);
  } catch (error) {
    console.log(error);
  }
};
module.exports = sendToken;
