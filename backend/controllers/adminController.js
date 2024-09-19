const Organiser = require('../models/Organiser');
const Player = require('../models/Player');
const Tournament = require('../models/Tournament');

// Ban an organiser
exports.banOrganiser = async (req, res) => {
  try {
    const organiser = await Organiser.findByIdAndUpdate(req.params.id, { banned: true });
    res.status(200).json({ message: 'Organiser banned', organiser });
  } catch (error) {
    res.status(400).json({ error });
  }
};

// Delete an organiser
exports.deleteOrganiser = async (req, res) => {
  try {
    await Organiser.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Organiser deleted' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

// Ban a player
exports.banPlayer = async (req, res) => {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, { banned: true });
    res.status(200).json({ message: 'Player banned', player });
  } catch (error) {
    res.status(400).json({ error });
  }
};

// Delete a player
exports.deletePlayer = async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Player deleted' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

// Approve a tournament
exports.approveTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(req.params.id, { status: 'Approved' });
    res.status(200).json({ message: 'Tournament approved', tournament });
  } catch (error) {
    res.status(400).json({ error });
  }
};