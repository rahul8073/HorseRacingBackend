const Horses = require('../Models/Horses');

// Create new horse(s)
exports.CreateHorse = async (req, res) => {
  try {
    let horsesData = req.body;

    // If it's a single object, wrap it in an array
    if (!Array.isArray(horsesData)) {
      horsesData = [horsesData];
    }

    // Validation: check all entries have horseNumber and horseName
    for (const horse of horsesData) {
      if (!horse.horseNumber || !horse.horseName) {
        return res.status(400).json({
          Result: 0,
          message: "Each horse must have horseNumber and horseName",
        });
      }
    }

    // Check for duplicate horseNumber in DB
    const horseNumbers = horsesData.map((h) => h.horseNumber);
    const existingHorses = await Horses.find({ horseNumber: { $in: horseNumbers } });

    if (existingHorses.length > 0) {
      const existingNumbers = existingHorses.map((h) => h.horseNumber);
      return res.status(400).json({
        Result: 0,
        message: "Some horseNumber(s) already exist",
        existingNumbers,
      });
    }

    // Insert horses
    const newHorses = await Horses.insertMany(horsesData);

    res.status(201).json({
      Result: 1,
      message: "Horse(s) created successfully",
      horses: newHorses,
    });
  } catch (error) {
    console.error("Error creating horses:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// Get all horses
exports.GetAllHorses = async (req, res) => {
  try {
    const horses = await Horses.find().sort({ createdAt: -1 });
    res.status(200).json({ Result: 1, horses });
  } catch (error) {
    console.error("Error fetching horses:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// Get horse by MongoDB _id
exports.GetHorseById = async (req, res) => {
  try {
    const horse = await Horses.findById(req.params.id);
    if (!horse) {
      return res.status(404).json({ Result: 0, message: "Horse not found" });
    }
    res.status(200).json({ Result: 1, horse });
  } catch (error) {
    console.error("Error fetching horse:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// Update horse
exports.UpdateHorse = async (req, res) => {
  try {
    const { horseNumber, horseName } = req.body;

    if (!horseNumber || !horseName) {
      return res.status(400).json({
        Result: 0,
        message: "horseNumber and horseName are required",
      });
    }

    const updatedHorse = await Horses.findByIdAndUpdate(
      req.params.id,
      { horseNumber, horseName },
      { new: true, runValidators: true }
    );

    if (!updatedHorse) {
      return res.status(404).json({ Result: 0, message: "Horse not found" });
    }

    res.status(200).json({
      Result: 1,
      message: "Horse updated successfully",
      horse: updatedHorse,
    });
  } catch (error) {
    console.error("Error updating horse:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};

// Delete horse (single or bulk)
exports.DeleteHorse = async (req, res) => {
  try {
    // single delete via params
    if (req.params.id) {
      const deletedHorse = await Horses.findByIdAndDelete(req.params.id);
      if (!deletedHorse) {
        return res.status(404).json({ Result: 0, message: "Horse not found" });
      }
      return res.status(200).json({ Result: 1, message: "Horse deleted successfully" });
    }

    // bulk delete via body
    const { ids } = req.body;
    if (ids && Array.isArray(ids) && ids.length > 0) {
      const result = await Horses.deleteMany({ _id: { $in: ids } });
      return res.status(200).json({
        Result: 1,
        message: `${result.deletedCount} horse(s) deleted successfully`,
      });
    }

    return res.status(400).json({ Result: 0, message: "Please provide id or ids" });
  } catch (error) {
    console.error("Error deleting horse:", error);
    res.status(500).json({ Result: 0, message: "Internal server error" });
  }
};
