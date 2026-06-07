import User, { IUser } from '../models/User';
import dbConnect from './mongodb';
import { SKILL_CATEGORIES, SKILL_COLORS } from './constants';

export { SKILL_CATEGORIES, SKILL_COLORS };

export async function findMatchingHelpers(
  category: string,
  seekerId: string,
  limit = 20
): Promise<IUser[]> {
  await dbConnect();
  
  // Find all users whose skills array includes the category, excluding seeker
  const helpers = await User.find({
    skills: category,
    _id: { $ne: seekerId }
  });

  // Sort in memory using the avgRating virtual property (descending)
  helpers.sort((a: any, b: any) => {
    return b.avgRating - a.avgRating;
  });

  return helpers.slice(0, limit);
}
