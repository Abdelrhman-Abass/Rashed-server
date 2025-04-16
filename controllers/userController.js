import prisma from '../prisma/client.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { bio, language, timezone } = req.body;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      update: { bio, language, timezone },
      create: {
        userId: req.user.id,
        bio,
        language: language || 'en',
        timezone,
      },
    });

    res.json(updatedProfile);
  } catch (error) {
    next(error);
  }
};