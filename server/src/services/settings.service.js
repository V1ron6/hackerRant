const { UserSettings, User } = require('../models');

exports.THEMES = ['default', 'ocean', 'forest', 'violet'];

const pub = (s) => ({
  notifications:  s.notifications,
  chat_theme:     s.chat_theme,
  share_location: s.share_location,
});

const load = async (userId) => {
  const [settings] = await UserSettings.findOrCreate({ where: { user_id: userId } });
  return settings;
};
exports.load = load;

exports.get = async (userId) => pub(await load(userId));

exports.update = async (userId, patch) => {
  const settings = await load(userId);

  for (const key of ['notifications', 'chat_theme', 'share_location']) {
    if (patch[key] !== undefined) settings[key] = patch[key];
  }
  await settings.save();

  // Turning sharing off also erases the stored position.
  if (patch.share_location === false) {
    await User.update({ latitude: null, longitude: null }, { where: { id: userId } });
  }

  return pub(settings);
};
