const Horses = require('../Models/Horses');

// Create new horse
exports.CreateHorse = async (req, res) => {
    try {
        const { ID, horseName } = req.body;

        if (!ID || !horseName) {
            return res.status(400).json({ message: "ID and horseName are required" });
        }

        // Check if horse with same ID already exists
        const existingHorse = await Horses.findOne({ ID });
        if (existingHorse) {
            return res.status(400).json({ message: "Horse with this ID already exists" });
        }

        const newHorse = new Horses({ ID, horseName });
        await newHorse.save();

        res.status(201).json({ message: "Horse created successfully", horse: newHorse });

    } catch (error) {
        console.error("Error creating horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all horses
exports.GetAllHorses = async (req, res) => {
    try {
        const horses = await Horses.find().sort({ createdAt: -1 });
        res.status(200).json(horses);

    } catch (error) {
        console.error("Error fetching horses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get horse by MongoDB _id
exports.GetHorseById = async (req, res) => {
    try {
        const horse = await Horses.findById(req.params.id);
        if (!horse) {
            return res.status(404).json({ message: "Horse not found" });
        }
        res.status(200).json(horse);

    } catch (error) {
        console.error("Error fetching horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update horse
exports.UpdateHorse = async (req, res) => {
    try {
        const { ID, horseName } = req.body;

        const updatedHorse = await Horses.findByIdAndUpdate(
            req.params.id,
            { ID, horseName },
            { new: true, runValidators: true }
        );

        if (!updatedHorse) {
            return res.status(404).json({ message: "Horse not found" });
        }

        res.status(200).json({ message: "Horse updated successfully", horse: updatedHorse });

    } catch (error) {
        console.error("Error updating horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Delete horse
exports.DeleteHorse = async (req, res) => {
    try {
        const deletedHorse = await Horses.findByIdAndDelete(req.params.id);
        if (!deletedHorse) {
            return res.status(404).json({ message: "Horse not found" });
        }

        res.status(200).json({ message: "Horse deleted successfully" });

    } catch (error) {
        console.error("Error deleting horse:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
