const Organiser = require("../models/Organiser");
const Player = require("../models/Player");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const bcrypt = require("bcrypt");



// Delete a tournament by tid (custom string identifier)
exports.deleteTournament = async (req, res) => {
    const { tournamentId } = req.params; // `tournamentId` refers to `tid` here

    try {
        // Find the tournament by `tid` (not by `_id`)
        const tournament = await Tournament.findOne({ tid: tournamentId });

        if (!tournament) {
            return res.status(404).json({ message: "Tournament not found" });
        }

        // Check if the user is the organiser of the tournament
        if (!tournament.organiser.equals(req.user._id)) {
            return res.status(403).json({ message: "You are not authorized to delete this tournament" });
        }

        // Remove the tournament from the organiser's tournament list
        await Organiser.findByIdAndUpdate(tournament.organiser, {
            $pull: { tournaments: tournament._id } // Use tournament._id here, not tid
        });

        // Finally, delete the tournament
        await Tournament.findOneAndDelete({ tid: tournamentId });

        res.status(200).json({ message: "Tournament deleted successfully" });
    } catch (error) {
        console.error("Error deleting tournament:", error);
        res.status(500).json({ message: "Error deleting tournament", error });
    }
};

// Route to render the points table for a specific tournament
exports.renderPointsTable = async (req, res) => {
  try {
    const { tournamentId } = req.params; // Get the tournament ID from the route parameters
    const tournament = await Tournament.findById(tournamentId); // Find the tournament by ID

    if (!tournament) {
      return res.status(404).send('Tournament not found');
    }

    // Ensure only the organiser can access this page
    if (req.user.role !== 'organiser') {
      return res.status(403).send('Unauthorized: Only organisers can update points');
    }

    // Render the EJS page with tournament data
    res.render('updatePointsTable', {
      tournament,
      userRole: req.user.role,
      username: req.user.username
    });
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return res.status(500).send('Server error');
  }
};
// Search Organisation
exports.getOrganiserByUsername = async (req, res) => {
  const { searchTerm } = req.query;

  try {
      const organisers = await Organiser.find({ username: { $regex: new RegExp(searchTerm, 'i') } })
          .populate('followers')
          .populate('tournaments');

      console.log(`Search term received: ${searchTerm}`);
      
      if (organisers.length === 0) {
          console.log(`No organisers found for the username: ${searchTerm}`);
          return res.render('searchOrg', {
              message: 'No organisers found',
              organisationResults: [],
              searchTerm: '',
              results: [] // Ensure results is defined as an empty array
          });
      }

      console.log(`${organisers.length} organisers found.`);
      return res.render('searchOrg', { // Render the new EJS template
          organisationResults: organisers,
          searchTerm: searchTerm,
          results: [] // Ensure results is defined as an empty array or pass tournament results as needed
      });
      
  } catch (error) {
      console.error('Error fetching organisers:', error);
      return res.status(500).render('error', { statusCode: '500', errorMessage: 'Error fetching organisers' });
  }
};



exports.updateOrganiserSettings = async (req, res) => {
  const { showTournaments, showFollowerCount, showPrizePool } = req.body;
  const { id } = req.user;

  try {
    const updatedVisibility = {
      showTournaments: !!showTournaments,
      showFollowerCount: !!showFollowerCount,
      showPrizePool: !!showPrizePool,
    };

    await Organiser.findByIdAndUpdate(id, {
      dashboardVisibility: updatedVisibility,
    });

    res.redirect("/organiser/dashboard");
  } catch (error) {
    console.error("Error updating visibility settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

exports.updateUsername = async (req, res) => {
  const { newUsername } = req.body;
  const { _id } = req.user;

  try {
    const organiser = await Organiser.findOne({ _id });
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    const existingOrganiser = await Organiser.findOne({
      username: newUsername,
    });
    if (existingOrganiser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    organiser.username = newUsername;
    await organiser.save();

    res
      .status(200)
      .json({ message: "Username updated successfully", organiser });
  } catch (error) {
    console.error("Error updating username:", error);
    res
      .status(500)
      .json({ error: "Error updating username", details: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  const { newEmail } = req.body;
  const { _id } = req.user;

  try {
    const organiser = await Organiser.findOne({ _id });
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    const existingOrganiser = await Organiser.findOne({ email: newEmail });
    if (existingOrganiser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    organiser.email = newEmail;
    await organiser.save();

    res.status(200).json({ message: "Email updated successfully", organiser });
  } catch (error) {
    console.error("Error updating Email:", error);
    res
      .status(500)
      .json({ error: "Error updating Email", details: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { _id } = req.user;

  console.log("Updating password for:", _id);
  try {
    const organiser = await Organiser.findOne({ _id });
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, organiser.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "New Password Cannot be the Same as Old Password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    organiser.password = hashedPassword;
    await organiser.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res
      .status(500)
      .json({ error: "Error updating password", details: error.message });
  }
};

exports.updateDescription = async (req, res) => {
  const { newDescription } = req.body;
  const { _id } = req.user;

  try {
    const organiser = await Organiser.findOne({ _id });
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    organiser.description = newDescription;
    await organiser.save();

    res
      .status(200)
      .json({ message: "Description updated successfully", organiser });
  } catch (error) {
    console.error("Error updating description:", error);
    res
      .status(500)
      .json({ error: "Error updating description", details: error.message });
  }
};

exports.updateProfilePhoto = async (req, res) => {
  const { newProfilePhoto } = req.body;
  const { _id } = req.user;

  try {
    const organiser = await Organiser.findOne({ _id });
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    organiser.profilePhoto = newProfilePhoto;
    await organiser.save();

    res
      .status(200)
      .json({ message: "Profile Photo updated successfully", organiser });
  } catch (error) {
    console.error("Error updating Profile Photo:", error);
    res
      .status(500)
      .json({ error: "Error updating Profile Photo", details: error.message });
  }
};

exports.updateVisibilitySettings = async (req, res) => {
  const { id } = req.user; // Assuming user ID is from JWT
  const {
    descriptionVisible,
    profilePhotoVisible,
    prizePoolVisible,
    tournamentsVisible,
    followersVisible,
  } = req.body;

  // Convert the string values to booleans
  const updatedVisibilitySettings = {
    descriptionVisible: descriptionVisible === 'on', // true if checked
    profilePhotoVisible: profilePhotoVisible === 'on', // true if checked
    prizePoolVisible: prizePoolVisible === 'on', // true if checked
    tournamentsVisible: tournamentsVisible === 'on', // true if checked
    followersVisible: followersVisible === 'on', // true if checked
  };

  try {
    const organiser = await Organiser.findByIdAndUpdate(
      id,
      { visibilitySettings: updatedVisibilitySettings },
      { new: true }
    );

    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    res.status(200).redirect(`/api/organiser/${organiser.username}/dashboard`);
  } catch (error) {
    console.error("Error updating visibility settings:", error);
    res.status(500).json({
      error: "Error updating visibility settings",
      details: error.message,
    });
  }
};


exports.renderUpdateVisibilitySettings = async (req, res) => {
    const { id } = req.user; // Assuming user ID is from JWT
    try {
        const organiser = await Organiser.findById(id);

        if (!organiser) {
            return res.status(404).json({ message: "Organiser not found" });
        }

        res.render('updateOrganiserDashboardVisibility', { organiser });
    } catch (error) {
        console.error("Error fetching organiser data:", error);
        res.status(500).json({ error: "Error fetching organiser data", details: error.message });
    }
};


exports.getOrganiserDashboard = async (req, res) => {
    const { username } = req.params; // Organiser's username passed in the URL
    const loggedInUserId = req.user._id; // Get the logged-in user's ID

    try {
        // Find the organiser by username
        const organiser = await Organiser.findOne({ username })
            .populate('tournaments')
            .populate('followers');

        if (!organiser) {
            return res.status(404).json({ message: 'Organiser not found' });
        }

        const isOwner = loggedInUserId.equals(organiser._id); // Check if logged-in user is the organiser
        console.log("DEBUG:ISOWNER:"+isOwner+"lOGGEDINID:"+loggedInUserId+"ORGID:"+organiser._id);
        const totalTournaments = organiser.tournaments.length;
        console.log("Total Tournaments Count Fetched:"+totalTournaments);
        const followerCount = organiser.followers.length;
        console.log("FollowerCount fetched: "+followerCount);

        // Fetch all tournaments organized by the organiser
        const tournamentList = await Tournament.find({ organiser: organiser._id });

        const totalPrizePool = tournamentList.reduce((sum, tournament) => sum + tournament.prizePool, 0);
        console.log(totalPrizePool);

        // Handle visibility settings for players
        const visibilitySettings = organiser.visibilitySettings || {
          descriptionVisible: true,
          profilePhotoVisible: true,
          prizePoolVisible: true,
          tournamentsVisible: true,
          followersVisible: true,
      };
      
        console.log("Visibility Settings:"+visibilitySettings , followerCount , totalPrizePool , totalTournaments , tournamentList);

        // Render the dashboard with all tournaments in a single list
        res.render('organiserDashboard', {
            organiser,
            isOwner,
            visibilitySettings,
            followerCount,
            totalPrizePool,
            totalTournaments,
            tournamentList
        });
    } catch (error) {
        console.error('Error fetching organiser dashboard:', error);
        res.status(500).json({ error: 'Error fetching organiser dashboard', details: error.message });
    }
};

exports.getMyOrganisers = async (req, res) => {
  const { _id } = req.user; // Player ID

  try {
      const player = await Player.findById(_id).populate({
          path: 'following', // Assuming this is the field in Player model
          model: 'Organiser',
          populate: {
              path: 'tournaments', // Assuming each organiser has a tournaments field
              model: 'Tournament' // Replace with your actual tournament model name
          }
      });

      if (!player) {
          return res.status(404).render('error', { message: 'Player not found' });
      }

      // Log followed organisers for debugging
      console.log('Followed Organisers:', player.following);

      // Render the homepage and pass the followed organisers
      res.render('homepage', {
          followedOrganisers: player.following // Pass followed organisers to the view
      });
  } catch (error) {
      console.error(error);
      return res.status(500).render('error', { message: 'Error retrieving followed organisers' });
  }
};



exports.banTeam = async (req, res) => {
  const { teamId } = req.body;
  const { _id } = req.user;

  try {
    const organiser = await Organiser.findById(_id);
    if (!organiser) {
      return res.status(404).json({ message: "Organiser not found" });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    if (organiser.bannedTeams.includes(teamId)) {
      return res.status(400).json({ message: "Team is already banned" });
    }

    organiser.bannedTeams.push(teamId);
    await organiser.save();

    res.status(200).json({
      message: "Team banned successfully from organiser's tournaments",
      organiser,
    });
  } catch (error) {
    console.error("Error banning team:", error);
    res
      .status(500)
      .json({ error: "Error banning team", details: error.message });
  }
};


// Route Has Been Tested and Is working successfully

// create update organiserdetails <DONE>
// update passwords  <DONE>
// Dashboards with details-->{
//      Tournaments Conducted:<DONE>
//      total people played with the Org:<DONE>
//      Total prizepool <DONE>
//      current Matches <DONE>
//      upcoming Matches <DONE>
//      completed matches <DONE>
//      }
// Ban Teams from organiser<DONE>
// Ban Players from organiser
