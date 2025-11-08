```ts
import { Request, Response, NextFunction } from "express";
import { sendWelcomeEmail } from "../utils/email-sender/send-email";
import { LoginUserInput, RegisterUserInput } from "../validation/auth.validation";
import { User } from "../models/user.model";
import { CustomError } from "../utils/custom-error";
import { comparePasswords, hashPassword } from "../utils/password";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { cookieOptions } from "../utils/cookies";
import { generateVerificationToken } from "../utils/token";

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
    const verificationToken = generateVerificationToken();

    // Lets create user
    const user = await User.create({
      name,
      email,
      username,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiry
      isVerified: false,
    });
    if (!user) {
      throw CustomError.Internal("User creation failed");
    }

    // Create JWT tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    //Lets create access and refresh token
    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    // Save refresh token in DB (to allow logout/invalidation)
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Set refresh token in secure cookie
    res.cookie("refreshToken", refreshToken, cookieOptions());

    // Send welcome email (async fire-and-forget pattern optional)
    // await sendWelcomeEmail(email, name, email);
    // await sendVerificationEmail(email, verificationToken);

    res.status(201).json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;
    if (!token) throw CustomError.BadRequest("Verification token missing");

    // Find user
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) throw CustomError.BadRequest("Invalid or expired verification token");

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

export const login = async (
  req: Request<{}, {}, LoginUserInput>,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw CustomError.BadRequest("Invalid credentials");

    if (!user.isVerified) {
      throw CustomError.Forbidden("Please verify your email before logging in");
    }

    const isMatch = await comparePasswords(user.password, password);
    if (!isMatch) throw CustomError.BadRequest("Invalid credentials");

    // Create JWT tokens
    const payload = {
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = await signAccessToken(payload);
    const refreshToken = await signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    res.cookie("refreshToken", refreshToken, cookieOptions());

    res.status(200).json({
      success: true,
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
```
