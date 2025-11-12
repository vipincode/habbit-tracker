import { NextFunction, Request, Response } from "express";
import { habitInputType } from "../validation/habit.validation";
import { Habit } from "../models/habit.model";
import { CustomError } from "../utils/custom-error";

export const createHabit = async (
  req: Request<{}, {}, habitInputType>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      throw CustomError.Unauthorized("User not authenticated");
    }

    const userId = req.user?.id;
    const { name, description, frequency, targetCount } = req.body;

    const habit = await Habit.create({
      userId,
      name,
      description,
      frequency,
      targetCount,
    });

    if (!habit) {
      throw CustomError.BadRequest("Habit not crated");
    }

    res.status(201).json({
      success: true,
      message: "Habit create successfully",
      data: habit,
    });
  } catch (error) {
    next(error);
  }
};
