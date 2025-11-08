import { Request, Response, NextFunction } from "express";
import { LoginUserInput, RegisterUserInput } from "../validation/auth.validation";
import { User } from "../models/user.model";
import { CustomError } from "../utils/custom-error";
import { comparePasswords, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { cookieOptions } from "../utils/cookies";
import { generateSecureToken, hashToken } from "../utils/token";
import { sendVerificationEmail } from "../utils/email-sender/send-email";
import ENV from "../config/env";

/**
 * Register
 * url: http://localhost:4000/api/auth/register
 */
export const register = async (
  req: Request<{}, {}, RegisterUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, username } = req.body;

    // Check is user exist in database
    const existing = await User.findOne({ email });
    if (existing) {
      throw CustomError.BadRequest("Email already registered");
    }

    // Hash password before saving
    const hashedPassword = await hashPassword(password);
    // Generate raw + hashed token pair
    const { rawToken, hashedToken } = generateSecureToken();

    // Lets create user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      verificationToken: hashedToken,
      verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      isVerified: false,
    });

    if (!user) {
      throw CustomError.Internal("User creation failed");
    }

    // Send verification email with raw token in link
    const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?token=${encodeURIComponent(rawToken)}`;

    // Send welcome email (async fire-and-forget pattern optional)
    await sendVerificationEmail(email, verificationUrl);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @Verify
 * url: http://localhost:4000/api/auth/verify-email?token=abc123
 */
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (!token) throw CustomError.BadRequest("Verification token missing");

    // Hash incoming token to match DB
    const hashedToken = hashToken(token as string);

    //  Find user by hashed token and check expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) throw CustomError.BadRequest("Invalid or expired verification token");

    // If already verified
    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified. You can log in.",
      });
    }

    // Verify user
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login
 * url: http://localhost:4000/api/auth/login
 */
export const login = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Lets check user is exist in db or not
    const user = await User.findOne({ email });
    if (!user) throw CustomError.BadRequest("Invalid credentials");

    if (!user.isVerified) {
      throw CustomError.Forbidden("Please verify your email before logging in");
    }

    // Compare password
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw CustomError.BadRequest("Invalid credentials");

    // Create JWT tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Create access and refresh token
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Update refresh token in db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set the cookie
    res.cookie("refreshToken", refreshToken, cookieOptions());

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}! You have successfully logged in.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token
 * url: http://localhost:4000/api/auth/refresh
 */
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (!cookieToken) {
      throw CustomError.Unauthorized("Missing refresh token");
    }

    // Verify JWT signature
    const decoded = await verifyRefreshToken(cookieToken);
    const userId = decoded.sub as string;

    console.log(userId, "userId");

    const user = await User.findById(userId);
    if (!user || user.refreshToken !== cookieToken) {
      if (user) {
        user.refreshToken = null;
        await user.save({ validateBeforeSave: false });
      }
      throw CustomError.Forbidden("Invalid or expired refresh token");
    }

    // Create JWT tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Generate new tokens
    const newAccessToken = await signAccessToken(payload);
    const newRefreshToken = await signRefreshToken(payload);

    // Rotate refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    // Send new cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions());

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 * url: http://localhost:4000/api/auth/logout
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookieToken = req.cookies?.refreshToken;
    if (cookieToken) {
      await User.findOneAndUpdate(
        { refreshToken: cookieToken },
        { $set: { refreshToken: null } },
        { new: true }
      );
    }
    // Clear the refreshToken cookie
    const options = cookieOptions();
    res.clearCookie("refreshToken", {
      ...options,
      maxAge: 0, // immediately expire the cookie
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};
